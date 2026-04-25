"""
Módulo de cuantificación de carga de entrenamiento basado en métricas clásicas
(TRIMP, TSS) y modelos de fitness‑fatiga (ATL/CTL/ACWR).

Incluye:
- Clase `SesionEntrenamiento` con métodos para calcular TSS y variantes de TRIMP.
- Clase `Atleta` para gestionar sesiones, calcular cargas aguda/crónica y sugerir
  ajustes según el estado de forma.
- Helper opcional para entrenar un modelo ML simple de riesgo de lesión/mejora.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date
from typing import Iterable, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def _hr_reserve_ratio(
    fc_media: float, fc_reposo: float, fc_max: float
) -> Optional[float]:
    """Retorna la fracción de reserva de FC (0-1) o None si faltan datos."""
    if not all([fc_media, fc_reposo, fc_max]):
        return None
    if fc_max <= fc_reposo:
        return None
    return max(0.0, min(1.0, (fc_media - fc_reposo) / (fc_max - fc_reposo)))


@dataclass
class SesionEntrenamiento:
    """
    Representa una sesión de entrenamiento.

    Atributos clave
    ---------------
    fecha: date
        Fecha de la sesión.
    duracion_min: float
        Duración en minutos.
    potencia_media_w: Optional[float]
        Potencia media (o NP si se dispone).
    distancia_km: Optional[float]
        Distancia recorrida.
    fc_media: Optional[float]
        Frecuencia cardiaca media.
    fc_reposo: Optional[float]
        FC de reposo (se puede heredar del atleta si no se define).
    fc_max: Optional[float]
        FC máxima (se puede heredar del atleta si no se define).
    sRPE: Optional[float]
        RPE subjetivo (0-10) para TRIMP de Foster.
    """

    fecha: date
    duracion_min: float
    potencia_media_w: Optional[float] = None
    distancia_km: Optional[float] = None
    fc_media: Optional[float] = None
    fc_reposo: Optional[float] = None
    fc_max: Optional[float] = None
    sRPE: Optional[float] = None

    def calcular_tss(self, ftp: Optional[float] = None) -> Optional[float]:
        """
        Calcula el Training Stress Score (versión simplificada).

        TSS = duracion_horas * (IF^2) * 100, donde IF = potencia_media / FTP.
        Si no hay potencia o FTP, retorna None.
        """
        if not self.potencia_media_w or not ftp:
            return None
        if ftp <= 0:
            return None
        intensidad_rel = self.potencia_media_w / ftp
        dur_horas = self.duracion_min / 60.0
        return dur_horas * (intensidad_rel**2) * 100.0

    def calcular_trimp_bannister(self, sexo: str = "masculino") -> Optional[float]:
        """
        TRIMP de Bannister (1975) usando FC de reserva.

        Fórmula: TRIMP = dur(min) * HRr * e^(b*HRr) * a
        Valores típicos: a=0.64, b=1.92 (hombres); a=0.86, b=1.67 (mujeres).
        """
        hr_ratio = _hr_reserve_ratio(self.fc_media, self.fc_reposo, self.fc_max)
        if hr_ratio is None:
            return None
        a, b = (0.64, 1.92) if sexo.lower().startswith("m") else (0.86, 1.67)
        return self.duracion_min * hr_ratio * math.exp(b * hr_ratio) * a

    def calcular_trimp_foster(self) -> Optional[float]:
        """
        TRIMP de Foster (sRPE): TRIMP = duración (min) * sRPE (0-10).
        """
        if self.sRPE is None:
            return None
        return self.duracion_min * self.sRPE

    def calcular_trimp_edwards(self, zonas_minutos: Optional[Sequence[Tuple[int, float]]] = None) -> Optional[float]:
        """
        TRIMP de Edwards (zonas de FC).

        Si se pasan `zonas_minutos`, debe ser una secuencia de tuplas (zona, minutos)
        donde zona ∈ {1,2,3,4,5}. Pesos: 1,2,3,4,5. Si no se pasan, se aproxima
        usando la FC media para asignar toda la duración a una sola zona.
        """
        pesos = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5}
        if zonas_minutos:
            return sum(pesos.get(z, 0) * mins for z, mins in zonas_minutos)

        hr_ratio = _hr_reserve_ratio(self.fc_media, self.fc_reposo, self.fc_max)
        if hr_ratio is None:
            return None
        # Asignación aproximada de zona por %HRR
        if hr_ratio < 0.6:
            zona = 1
        elif hr_ratio < 0.7:
            zona = 2
        elif hr_ratio < 0.8:
            zona = 3
        elif hr_ratio < 0.9:
            zona = 4
        else:
            zona = 5
        return pesos[zona] * self.duracion_min

    def calcular_trimp_lucia(self, vt1: Optional[float] = None, vt2: Optional[float] = None) -> Optional[float]:
        """
        TRIMP de Lucía (3 zonas). Pesos: Z1=1, Z2=2, Z3=3.

        Si se proporcionan VT1/VT2 (umbrales ventilatorios en FC), se usan.
        En su defecto, se aproxima con %HRR: <70% Z1, 70-85% Z2, >85% Z3.
        """
        if self.fc_media is None or (vt1 is None and vt2 is None and (self.fc_reposo is None or self.fc_max is None)):
            return None

        if vt1 and vt2:
            if self.fc_media < vt1:
                peso = 1
            elif self.fc_media < vt2:
                peso = 2
            else:
                peso = 3
        else:
            hr_ratio = _hr_reserve_ratio(self.fc_media, self.fc_reposo, self.fc_max)
            if hr_ratio is None:
                return None
            if hr_ratio < 0.7:
                peso = 1
            elif hr_ratio < 0.85:
                peso = 2
            else:
                peso = 3
        return peso * self.duracion_min

    def calcular_trimp_total(self) -> Optional[float]:
        """
        Retorna un valor de TRIMP preferente (Bannister > Foster > Edwards).
        Útil cuando no se especifica la variante deseada.
        """
        return (
            self.calcular_trimp_bannister()
            or self.calcular_trimp_foster()
            or self.calcular_trimp_edwards()
        )

    def calcular_indice_eficiencia(self) -> Optional[float]:
        """
        Índice de eficiencia (EF): velocidad o potencia normalizada por FC.
        Si hay potencia, usa potencia_media/fc_media. Si no, usa velocidad (m/min).
        """
        if self.fc_media is None or self.fc_media <= 0:
            return None
        if self.potencia_media_w:
            return self.potencia_media_w / self.fc_media
        if self.distancia_km:
            velocidad_m_min = (self.distancia_km * 1000.0) / self.duracion_min
            return velocidad_m_min / self.fc_media
        return None


@dataclass
class Atleta:
    """
    Agrupa datos del atleta y operaciones sobre sus sesiones.

    Atributos clave
    ---------------
    fc_reposo: float
        FC de reposo (bpm).
    fc_max: float
        FC máxima (bpm).
    ftp: Optional[float]
        Umbral funcional de potencia para TSS.
    vt1/vt2: Optional[float]
        Umbrales ventilatorios (bpm) para TRIMP de Lucía.
    sesiones: List[SesionEntrenamiento]
        Historial de sesiones.
    """

    nombre: str
    fc_reposo: float
    fc_max: float
    ftp: Optional[float] = None
    vt1: Optional[float] = None
    vt2: Optional[float] = None
    sesiones: List[SesionEntrenamiento] = field(default_factory=list)

    def agregar_sesion(self, sesion: SesionEntrenamiento) -> None:
        """Añade una sesión completando valores de FC faltantes desde el atleta."""
        if sesion.fc_reposo is None:
            sesion.fc_reposo = self.fc_reposo
        if sesion.fc_max is None:
            sesion.fc_max = self.fc_max
        self.sesiones.append(sesion)

    def _serie_carga(
        self, metodo: str = "tss", usar_bannister: bool = True
    ) -> pd.Series:
        """
        Devuelve una serie diaria de carga (índice por fecha).
        Prioriza TSS; si falta, usa TRIMP Bannister u otro disponible.
        """
        registros = []
        for s in self.sesiones:
            if metodo == "tss":
                carga = s.calcular_tss(self.ftp)
                if carga is None and usar_bannister:
                    carga = s.calcular_trimp_bannister()
            else:
                carga = s.calcular_trimp_bannister() if usar_bannister else s.calcular_trimp_total()
            if carga is not None:
                registros.append((s.fecha, carga))
        if not registros:
            return pd.Series(dtype=float)

        df = pd.DataFrame(registros, columns=["fecha", "carga"])
        df = df.groupby("fecha", as_index=False)["carga"].sum().sort_values("fecha")
        df = df.set_index("fecha")

        # Rellenamos días sin sesión con 0 para que el suavizado sea correcto
        idx_completo = pd.date_range(df.index.min(), df.index.max(), freq="D")
        return df.reindex(idx_completo, fill_value=0.0)["carga"]

    def calcular_atl_ctl_acwr(
        self,
        metodo: str = "tss",
        tau_atl: float = 7.0,
        tau_ctl: float = 42.0,
    ) -> dict:
        """
        Calcula ATL, CTL y ACWR usando medias móviles exponenciales.

        alpha = 1 - exp(-1/tau). Retorna dict con las últimas estimaciones.
        """
        serie = self._serie_carga(metodo=metodo)
        if serie.empty:
            return {"atl": None, "ctl": None, "acwr": None}

        alpha_atl = 1 - math.exp(-1 / tau_atl)
        alpha_ctl = 1 - math.exp(-1 / tau_ctl)

        atl = serie.ewm(alpha=alpha_atl, adjust=False).mean()
        ctl = serie.ewm(alpha=alpha_ctl, adjust=False).mean()

        atl_val = float(atl.iloc[-1])
        ctl_val = float(ctl.iloc[-1])
        acwr = atl_val / ctl_val if ctl_val > 0 else None

        return {"atl": atl_val, "ctl": ctl_val, "acwr": acwr}

    def calcular_indice_eficiencia_medio(self) -> Optional[float]:
        """Devuelve el EF medio de las sesiones con datos válidos."""
        valores = [
            s.calcular_indice_eficiencia() for s in self.sesiones
            if s.calcular_indice_eficiencia() is not None
        ]
        if not valores:
            return None
        return float(np.mean(valores))

    def recomendar_ajuste_carga(
        self,
        metodo: str = "tss",
        tau_atl: float = 7.0,
        tau_ctl: float = 42.0,
        umbral_alto: float = 1.3,
        umbral_bajo: float = 0.8,
    ) -> str:
        """
        Genera una recomendación simple basada en fitness-fatiga (ATL/CTL) y ACWR.
        """
        metricas = self.calcular_atl_ctl_acwr(metodo=metodo, tau_atl=tau_atl, tau_ctl=tau_ctl)
        atl, ctl, acwr = metricas["atl"], metricas["ctl"], metricas["acwr"]

        if atl is None or ctl is None or acwr is None:
            return "Sin datos suficientes para recomendar ajustes de carga."

        if acwr > umbral_alto or atl > ctl * 1.1:
            return "Carga alta / fatiga elevada: reducir volumen o intensidad y priorizar recuperación."
        if acwr < umbral_bajo:
            return "Carga baja: se puede incrementar progresivamente el volumen o añadir intensidad."
        return "Estado estable: mantener la progresión actual con ligeras variaciones."


def entrenar_modelo_machine_learning(
    df: pd.DataFrame,
    variable_objetivo: str = "lesion",
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[Pipeline, float]:
    """
    Entrena un modelo de regresión logística con elastic net para predecir riesgo de lesión/mejora.

    Parámetros
    ----------
    df : pd.DataFrame
        Datos con variables predictoras y la columna objetivo (binaria o probabilística).
    variable_objetivo : str
        Nombre de la columna objetivo.
    test_size : float
        Proporción de datos para test.
    random_state : int
        Semilla para reproducibilidad.

    Retorna
    -------
    modelo : Pipeline
        Pipeline con estandarizador y regresión logística.
    score_test : float
        AUC o accuracy (usa score por defecto de sklearn).
    """
    if variable_objetivo not in df.columns:
        raise ValueError(f"La columna objetivo '{variable_objetivo}' no está en el DataFrame.")

    X = df.drop(columns=[variable_objetivo])
    y = df[variable_objetivo]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    modelo = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "clf",
                LogisticRegression(
                    penalty="elasticnet",
                    solver="saga",
                    l1_ratio=0.5,
                    max_iter=200,
                ),
            ),
        ]
    )

    modelo.fit(X_train, y_train)
    score = modelo.score(X_test, y_test)
    return modelo, score


if __name__ == "__main__":
    # Ejemplo rápido de uso
    atleta = Atleta(nombre="Ana", fc_reposo=50, fc_max=185, ftp=250)

    sesiones = [
        SesionEntrenamiento(
            fecha=date(2024, 10, 1),
            duracion_min=60,
            potencia_media_w=180,
            fc_media=150,
            sRPE=6,
            distancia_km=25,
        ),
        SesionEntrenamiento(
            fecha=date(2024, 10, 2),
            duracion_min=45,
            potencia_media_w=200,
            fc_media=158,
            sRPE=7,
            distancia_km=20,
        ),
        SesionEntrenamiento(
            fecha=date(2024, 10, 4),
            duracion_min=30,
            fc_media=140,
            sRPE=4,
            distancia_km=6,
        ),
    ]

    for ses in sesiones:
        atleta.agregar_sesion(ses)

    print("TSS sesiones:", [s.calcular_tss(atleta.ftp) for s in atleta.sesiones])
    print("TRIMP Bannister:", [s.calcular_trimp_bannister() for s in atleta.sesiones])
    print("EF medio:", atleta.calcular_indice_eficiencia_medio())
    print("ATL/CTL/ACWR:", atleta.calcular_atl_ctl_acwr())
    print("Recomendación:", atleta.recomendar_ajuste_carga())

    # Ejemplo mínimo de entrenamiento ML (datos ficticios)
    df_ejemplo = pd.DataFrame(
        {
            "atl": [40, 55, 70, 30, 90, 65, 45, 80],
            "acwr": [0.9, 1.1, 1.4, 0.7, 1.6, 1.2, 0.95, 1.3],
            "sueno_horas": [7, 6, 5, 8, 4, 6, 7.5, 5.5],
            "animo": [7, 6, 5, 8, 4, 6, 7, 5],
            "lesion": [0, 0, 1, 0, 1, 0, 0, 1],
        }
    )
    modelo, score = entrenar_modelo_machine_learning(df_ejemplo, variable_objetivo="lesion")
    print("Score modelo (accuracy):", round(score, 3))
