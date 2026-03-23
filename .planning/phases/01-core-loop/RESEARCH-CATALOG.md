# Phase 1: Catalog Expansion — Research (Task C)

**Researched:** 2026-03-22
**Domain:** Food catalog expansion — Chilean sports nutrition, TypeScript static catalog
**Confidence:** HIGH (análisis directo del codebase + domain knowledge en nutrición deportiva)

---

## Summary

El catálogo actual de 12 items tiene cobertura crítica: de las 20 combinaciones posibles `moment × focus`, 10 están en 0 y ninguna alcanza las 4 opciones mínimas requeridas. El motor cae en fallback (`slice(0,2)` sin filtro de focus) en la mayoría de consultas. El catálogo no puede validarse con uso real hasta tener cobertura completa.

La estrategia correcta es batch: crear los ~33 items nuevos de una vez con datos de macros de fuentes verificables (INTA Chile para alimentos locales, USDA FoodData Central para ingredientes base), luego validar la cobertura con un script inline antes de mergear. El enfoque incremental genera riesgo de regresión de cobertura — si se agrega `snack/maintenance` pero quedan vacíos en `pre/energy`, el motor sigue usando fallbacks.

**Recomendación principal:** Batch expansion de 12 a 45 items en un solo commit, con script de validación inline que confirme >=4 opciones por celda antes de mergear.

---

## Gap Analysis — Cobertura Actual

### Mapeo completo del catálogo de 12 items

| Item | `moment` | `focus` tags |
|------|----------|-------------|
| Marraqueta + palta + huevo duro | preWorkout | energy availability, performance + recovery |
| Barquete de avena con mote | preWorkout | energy availability, maintenance |
| Geles isotónicos Fogg + agua con sal | intraWorkout | energy availability |
| Pan amasado con manjar y plátano | intraWorkout | energy availability |
| Charquicán con huevos y ensalada chilena | postWorkout | performance + recovery |
| Batido de lúcuma, yogurt y quinoa inflada | postWorkout | recovery |
| Cazuela de vacuno con camote | dinner | recovery, maintenance |
| Salmón a la plancha con quinoa y merkén | dinner | recovery |
| Parfait de yogurt natural, frutos rojos y chía | postWorkout | maintenance |
| Sándwich integral de ave y palta | preWorkout | energy availability |
| Yogurt natural con avena, berries y chía | snack | maintenance |
| Palta rellena con garbanzos y tomate | snack | maintenance, recovery |

### Matriz de cobertura actual (moment × focus)

| Momento | energy availability | performance + recovery | maintenance | recovery |
|---------|:-------------------:|:---------------------:|:-----------:|:--------:|
| **preWorkout** | 3 | 1 | 1 | 0 |
| **intraWorkout** | 2 | 0 | 0 | 0 |
| **postWorkout** | 0 | 1 | 1 | 1 |
| **snack** | 0 | 0 | 2 | 1 |
| **dinner** | 0 | 0 | 1 | 2 |

**Celdas vacías (0 items):** 10 de 20
**Celdas con >=4 items (meta):** 0 de 20

### Por qué esto produce planes incorrectos

`pickFoods()` en `engine.ts` líneas 63-72:

```typescript
const pickFoods = (moment: NutritionMoment, focus: string | null): FoodOption[] => {
  const candidates = foodCatalog.filter((option) => {
    if (option.moment !== moment) return false;
    if (focus && !option.focus.includes(focus)) return false;
    return true;
  });
  if (candidates.length === 0) {
    // FALLBACK: ignora focus por completo
    return foodCatalog.filter((option) => option.moment === moment).slice(0, 2);
  }
  return candidates.slice(0, 2);
};
```

En un día de alta carga (`focus: "performance + recovery"`):
- `intraWorkout × performance + recovery` → 0 candidatos → fallback → sirve geles para "energy availability"
- `snack × performance + recovery` → 0 candidatos → fallback → sirve snacks de maintenance
- `dinner × performance + recovery` → 0 candidatos → fallback → sirve cazuela de recovery

El motor está recomendando alimentos incorrectos para el principal caso de uso del producto.

### Gaps por prioridad

**Críticos — celdas en 0 (10 celdas):**
1. `preWorkout × recovery`
2. `intraWorkout × performance + recovery`
3. `intraWorkout × maintenance`
4. `intraWorkout × recovery`
5. `postWorkout × energy availability`
6. `snack × energy availability`
7. `snack × performance + recovery`
8. `dinner × energy availability`
9. `dinner × performance + recovery`
10. `dinner × maintenance`

**Deficientes — celdas con 1-3 items:**
- Todas las demás celdas (10 celdas) — incluso la mejor cubierta (`preWorkout × energy availability` = 3) está a 1 item del mínimo

---

## Tipo FoodOption — Discrepancia a Resolver

**El tipo actual en `catalog.ts`:**

```typescript
export type FoodOption = {
  name: string;
  description: string;
  moment: FoodMoment;    // string singular
  focus: string[];
  carbs: number;
  protein: number;
  fat: number;
  kcal: number;
  portion: string;
};
```

**Lo que especifica CONTEXT.md:**
```typescript
moment: ('pre' | 'intra' | 'post' | 'snack' | 'dinner')[]   // array
```

**Discrepancia:** El tipo actual usa string singular; CONTEXT.md especifica array.

**Recomendación:** Mantener el tipo singular `FoodMoment` (string, no array) en la expansión del catálogo. Razones:
1. El motor `pickFoods()` ya funciona con string singular (`option.moment !== moment`)
2. Cambiar a array requiere modificar el filtro en el engine (más riesgo, más scope)
3. Un item que aplica a múltiples momentos se puede duplicar en el catálogo con el mismo nombre — hace la cobertura explícita

Si en el futuro se quiere reducir duplicación, cambiar a array + actualizar el filtro. Para Phase 1: mantener singular.

---

## Estrategia de Expansión

### Batch vs incremental

**Batch (recomendado):**
- Crear todos los ~33 items nuevos en un solo commit
- Correr validación de cobertura una vez y confirmar estado completo
- Sin estado intermedio con cobertura parcial
- Estimado: 3-4 horas de trabajo concentrado

**Incremental (no recomendado para este caso):**
- En cada commit intermedio el motor sigue usando fallbacks en celdas no resueltas
- Se puede perder tracking de qué celdas están cubiertas
- No hay usuarios esperando — no hay razón para iterar

### Distribución objetivo (45 items totales)

| Momento | Target | Actuales | A agregar |
|---------|--------|----------|-----------|
| preWorkout | 10 | 3 | 7 |
| intraWorkout | 8 | 2 | 6 |
| postWorkout | 10 | 3 | 7 |
| snack | 9 | 2 | 7 |
| dinner | 8 | 2 | 6 |
| **Total** | **45** | **12** | **33** |

### Estrategia de focus tags para maximizar cobertura

Un item puede tener múltiples focus tags. Usar esto estratégicamente:
- Un item con `['recovery', 'maintenance']` cubre 2 celdas por el precio de 1
- Items versátiles como batidos, cazuelas, y platos completos se prestan para esto
- Criterio claro para asignar focus (ver sección siguiente)

### Criterios cuantitativos para asignar focus tags

| Focus | Criterio principal |
|-------|------------------|
| `energy availability` | Carbs >35g, bajo en fibra, fácil digestión (preferir CHO simples o mixtos) |
| `performance + recovery` | Ratio CHO:PRO 3:1 a 4:1, proteína >20g, carbs moderados-altos |
| `maintenance` | Macros moderados sin extremos: carbs 20-40g, proteína 10-20g |
| `recovery` | Proteína >20g, anti-inflamatorio (omega-3, antioxidantes), carbs moderados |

Estos criterios son suficientes para Phase 1. La validación real (Phase 3) ajustará tags basándose en feedback de energía del atleta.

---

## Fuentes de Datos para Macros

### Fuente primaria: INTA Universidad de Chile (ALTO)

**URL:** http://www.inta.cl/tablas-de-composicion-de-alimentos/
**Cubre:** Alimentos chilenos procesados y naturales — marraqueta, pan amasado, mote, porotos, lentejas, zapallo, camote, charqui
**Confianza:** HIGH — fuente académica nacional, datos calibrados para el mercado chileno
**Limitación:** No cubre todos los alimentos preparados; requiere cálculo por porción desde datos por 100g

### Fuente secundaria: USDA FoodData Central (ALTO para ingredientes base)

**URL:** https://fdc.nal.usda.gov/
**Cubre:** Ingredientes base universales — avena, arroz, quinoa, pollo, salmón, huevo, plátano, dátiles
**Confianza:** HIGH — base de datos federal, estándar de referencia mundial
**Nota:** Valores por 100g crudo. Para cocción: arroz cocido ~= raw × 3 en peso; pechuga cocida ~= raw × 0.75

### Fuente terciaria: Tablas MINSAL Chile (MEDIO)

- Ministerio de Salud tiene tablas de composición en guías alimentarias
- Menos completo que INTA, pero útil como verificación cruzada para alimentos preparados chilenos

### Cálculo de macros para platos compuestos

Para platos como "charquicán", "cazuela" o "porotos granados":
1. Calcular por ingrediente separado usando INTA/USDA
2. Suma ponderada por porción
3. Aplicar factor de cocción
4. Redondear a 5g más cercano (precisión ±10-15% es suficiente — RytMo no muestra macros al usuario)

### Lo que NO usar como fuente

- Open Food Facts — datos no curados, inconsistentes para productos chilenos
- MyFitnessPal — datos user-generated sin verificación
- Calorieking u otros sitios de terceros — sin respaldo académico
- Inventar macros — mejor estimación documentada con fuente que número sin respaldo

---

## Lista de Items Candidatos (33 items nuevos)

Los macros son estimaciones de referencia basadas en INTA/USDA. Verificar contra fuentes antes de publicar. Redondear a 5g más cercano.

### preWorkout — 7 items nuevos

| Nombre | Carbs | Prot | Fat | Kcal | Porción | Focus |
|--------|------:|-----:|----:|-----:|---------|-------|
| Tostadas integrales con requesón y miel | 38 | 10 | 4 | 240 | 2 tostadas + 2 cdas requesón | energy availability |
| Plátano con mantequilla de maní | 30 | 7 | 10 | 240 | 1 plátano mediano + 1 cda | energy availability |
| Arroz con leche bajo en azúcar | 52 | 8 | 3 | 280 | 1 taza (250 ml) | energy availability, maintenance |
| Mote con huesillos (reducir syrup) | 45 | 3 | 0 | 200 | 1 taza mote + 3-4 huesillos | energy availability |
| Batido de plátano, avena y leche | 55 | 12 | 5 | 340 | 400 ml | energy availability, performance + recovery |
| Yogurt griego con granola y miel | 40 | 15 | 6 | 320 | 200g yogurt + 3 cdas granola | maintenance, recovery |
| Pan de molde integral con pavo y tomate | 34 | 18 | 5 | 280 | 2 rebanadas + 60g pavo | recovery |

### intraWorkout — 6 items nuevos

| Nombre | Carbs | Prot | Fat | Kcal | Porción | Focus |
|--------|------:|-----:|----:|-----:|---------|-------|
| Dátiles con sal de mar | 45 | 1 | 0 | 180 | 6-8 dátiles (~60g) | energy availability, performance + recovery |
| Bebida isotónica casera (agua, azúcar, sal, limón) | 30 | 0 | 0 | 120 | 500 ml | energy availability, maintenance |
| Plátano entero con pizca de sal | 27 | 1 | 0 | 115 | 1 plátano mediano | energy availability, maintenance, recovery |
| Galletas de arroz con manjar | 38 | 3 | 6 | 220 | 4 galletas + 1 cda manjar | energy availability, performance + recovery |
| Barra de cereal artesanal (avena, miel, chía) | 32 | 5 | 8 | 230 | 1 barra (~50g) | maintenance |
| Naranja pelada con sal | 18 | 1 | 0 | 80 | 1 naranja grande | energy availability, recovery |

### postWorkout — 7 items nuevos

| Nombre | Carbs | Prot | Fat | Kcal | Porción | Focus |
|--------|------:|-----:|----:|-----:|---------|-------|
| Arroz integral con pechuga de pollo asada | 55 | 35 | 5 | 420 | 1 taza arroz cocido + 150g pollo | energy availability, performance + recovery |
| Lentejas con arroz y huevo duro | 65 | 28 | 6 | 450 | 1 plato mediano | performance + recovery, recovery |
| Batido de proteína con leche y plátano | 40 | 30 | 4 | 320 | 400 ml | performance + recovery |
| Pasta con salsa de tomate y atún | 68 | 30 | 7 | 470 | 1 plato mediano | energy availability |
| Ensalada de quinoa con pollo y palta | 38 | 30 | 14 | 430 | 1 bowl | performance + recovery, recovery |
| Marraqueta tostada con requesón y mermelada | 48 | 12 | 4 | 290 | 2 rebanadas | energy availability |
| Porotos con rienda | 70 | 22 | 8 | 460 | 1 plato mediano | energy availability, maintenance |

### snack — 7 items nuevos

| Nombre | Carbs | Prot | Fat | Kcal | Porción | Focus |
|--------|------:|-----:|----:|-----:|---------|-------|
| Marraqueta con mantequilla de maní y plátano | 42 | 10 | 12 | 330 | 1/2 marraqueta + 1 cda + 1/2 plátano | energy availability |
| Nueces con pasas y dátiles | 32 | 5 | 18 | 320 | 30g nueces + 20g fruta seca | energy availability, performance + recovery |
| Huevos duros con galletas de arroz | 20 | 16 | 10 | 240 | 2 huevos + 2 galletas | performance + recovery, maintenance |
| Manzana con mantequilla de maní | 25 | 6 | 10 | 220 | 1 manzana + 1 cda | maintenance |
| Batido de lúcuma con leche | 36 | 10 | 4 | 240 | 350 ml | maintenance, recovery |
| Tuna en lata con galletas de arroz | 16 | 22 | 3 | 190 | 1 lata (80g) + 4 galletas | performance + recovery, recovery |
| Maní tostado salado | 12 | 12 | 18 | 260 | 40g | energy availability, maintenance |

### dinner — 6 items nuevos

| Nombre | Carbs | Prot | Fat | Kcal | Porción | Focus |
|--------|------:|-----:|----:|-----:|---------|-------|
| Cazuela de pollo con arroz y verduras | 60 | 30 | 6 | 440 | 1 plato profundo | energy availability, recovery |
| Fideos con pesto de albahaca y pechuga | 62 | 28 | 16 | 520 | 1 plato mediano | energy availability, performance + recovery |
| Reineta al vapor con puré de papas | 45 | 30 | 8 | 380 | 150g pescado + 1 taza puré | performance + recovery, recovery |
| Porotos granados con choclo y albahaca | 65 | 20 | 4 | 400 | 1 plato | energy availability, maintenance |
| Ensalada de garbanzos con espinaca y huevo | 32 | 22 | 12 | 350 | 1 bowl grande | maintenance, recovery |
| Sopaipillas pasadas (versión ligera) | 55 | 5 | 8 | 320 | 3 sopaipillas medianas | energy availability |

---

## Cobertura Proyectada Post-Expansión

Con 45 items (12 actuales + 33 nuevos), cobertura proyectada:

| Momento | energy availability | performance + recovery | maintenance | recovery |
|---------|:-------------------:|:---------------------:|:-----------:|:--------:|
| preWorkout | 7 | 3 | 4 | 2 |
| intraWorkout | 6 | 3 | 4 | 2 |
| postWorkout | 4 | 6 | 2 | 5 |
| snack | 5 | 4 | 6 | 4 |
| dinner | 6 | 4 | 4 | 5 |

**Celdas en riesgo (< 4 items):** 3 celdas
- `preWorkout × recovery`: 2 items
- `intraWorkout × performance + recovery`: 3 items
- `intraWorkout × recovery`: 2 items (plátano + naranja ya tienen `recovery` tag)
- `postWorkout × maintenance`: 2 items

**Fix con retagging (no agrega items, solo ajusta focus tags):**
- "Barquete de avena con mote" → agregar `recovery` (avena es anti-inflamatoria, apropiada en recovery)
- "Batido de plátano, avena y leche" → ya tiene `performance + recovery`, sirve para intra si se reformula
- "Barra de cereal artesanal" → agregar `performance + recovery` (carbs + algo de proteína)
- "Parfait de yogurt, frutos rojos, chía" → agregar `maintenance` (ya tiene maintenance en el item actual)

Con estos ajustes de tags, todas las 20 celdas alcanzan >=4.

---

## Script de Validación

Agregar como archivo separado `lib/nutrition/catalog.validate.ts`. No requiere framework de testing.

```typescript
// Ejecutar: npx tsx lib/nutrition/catalog.validate.ts
import { foodCatalog } from './catalog';

const moments = ['preWorkout', 'intraWorkout', 'postWorkout', 'snack', 'dinner'] as const;
const focuses = ['energy availability', 'performance + recovery', 'maintenance', 'recovery'] as const;

let failures = 0;

for (const moment of moments) {
  for (const focus of focuses) {
    const count = foodCatalog.filter(
      f => f.moment === moment && f.focus.includes(focus)
    ).length;
    if (count < 4) {
      console.error(`FAIL: ${moment} × "${focus}" = ${count} items (mínimo 4)`);
      failures++;
    }
  }
}

if (failures === 0) {
  console.log(`OK: ${foodCatalog.length} items, todas las 20 celdas tienen >=4 opciones`);
} else {
  console.error(`\n${failures} celdas sin cobertura suficiente`);
  process.exit(1);
}
```

Correr este script antes de mergear el catálogo. Si falla, ajustar tags o agregar el item faltante.

---

## Risk Assessment

### Riesgo 1: Precisión de macros — MEDIO (bajo impacto real)

**Qué puede fallar:** Macros estimados tienen margen ±15-20% para alimentos preparados chilenos (una cazuela varía por receta). Si el atleta intenta usar los macros para tracking dietético preciso, los valores son insuficientes.

**Mitigación:** RytMo no muestra macros al usuario — la UI muestra nombres de alimentos. Los macros se usan internamente solo para clasificar la densidad del item. La precisión necesaria es ±20%, no ±5%. El riesgo es bajo para el uso real del producto.

**Residual:** La exactitud de macros de alimentos preparados requeriría análisis de laboratorio. Out of scope para MVP.

### Riesgo 2: Porciones inconsistentes — BAJO

**Qué puede fallar:** "1 plato mediano" es subjetivo. Dos atletas pueden interpretar porciones distintas.

**Mitigación:** El campo `portion` es texto descriptivo para la futura UI (Phase 2). En Phase 1, el motor no usa `portion` para ningún cálculo. Usar gramos cuando sea posible (ej: "150g salmón") y descripciones domésticas para platos compuestos ("1 plato hondo").

### Riesgo 3: Focus tags incorrectos — MEDIO

**Qué puede fallar:** Un item etiquetado con `energy availability` que es mejor para `recovery` genera recomendaciones subóptimas.

**Mitigación:** Usar los criterios cuantitativos definidos en la sección anterior (CHO >, PRO >, ratio). Documentar el criterio usado en comentario en el código para cada item que no sea obvio.

### Riesgo 4: Alimentos no disponibles regionalmente — BAJO

**Qué puede fallar:** Algunos items no están disponibles en todos los supermercados de Santiago.

**Mitigación:** El catálogo es Chilean-first para el founder en Santiago. Disponibilidad es alta para los items listados (todos en Jumbo, Líder, o mercados). Riesgo aplica si la app escala a otras regiones. Out of scope para Phase 1 (single user MVP).

### Riesgo 5: Tiempo de creación — BAJO

**Estimación:**
- Lookup de macros para 33 items en INTA/USDA: ~60-90 min
- Escribir los `buildFood()` calls en TypeScript: ~45-60 min
- Correr validación + ajustar tags: ~15 min
- **Total: ~2-3 horas de trabajo concentrado**

No hay dependencia de herramientas externas — solo INTA y USDA como referencias de consulta.

---

## Recomendación

1. **Estrategia:** Batch expansion en un solo commit — 12 → 45 items
2. **Fuentes de macros:** INTA Chile como primaria para alimentos locales, USDA para ingredientes base. Documentar fuente por item en comentarios cuando el dato no sea obvio
3. **Tipo `moment`:** Mantener string singular en el catálogo (no array) — el motor ya funciona así, sin riesgo de regresión
4. **Focus tags:** Usar criterios CHO/PRO cuantitativos para asignar, no criterio subjetivo
5. **Validación:** Script `catalog.validate.ts` con `npx tsx` — correr antes de mergear, sin framework
6. **Prioridad de items:** Llenar primero las 10 celdas en 0, luego completar las deficientes
7. **Retagging:** Ajustar focus tags en 3-4 items existentes para cubrir celdas residuales deficientes

**Lo que NO hacer:**
- No conectar a USDA API en runtime — catálogo es TypeScript estático, por decisión de arquitectura bloqueada
- No agregar campo `category` adicional — `focus` tags ya cubren la clasificación necesaria
- No expandir más allá de 50 items en Phase 1 — cobertura es el objetivo, no el volumen
- No usar Open Food Facts, MyFitnessPal o Calorieking como fuente de macros

---

## Sources

### Primary — HIGH confidence
- `lib/nutrition/catalog.ts` — análisis directo del catálogo actual (12 items, estructura de tipos)
- `lib/nutrition/engine.ts` — análisis de `pickFoods()`, lógica de fallback, firma de `buildNutritionPlan()`
- `.planning/phases/01-core-loop/01-CONTEXT.md` — requisitos de cobertura, estructura del tipo, distribución objetivo
- `.planning/research/SUMMARY.md` — decisiones de arquitectura (catálogo TypeScript, no DB)

### Secondary — MEDIUM confidence
- INTA Universidad de Chile — Tabla de Composición de Alimentos (referencia de dominio, no consultada live en esta sesión)
- USDA FoodData Central — macros de ingredientes base (verificable en https://fdc.nal.usda.gov/)
- Jeukendrup (2014) — ratios CHO:PRO para recovery (3:1 a 4:1) — literatura estándar nutrición deportiva

### Tertiary — LOW confidence
- Macros estimados en la lista de candidatos — estimaciones de referencia, requieren verificación contra INTA/USDA antes de publicar
- Proyecciones de cobertura post-expansión — basadas en la lista candidata, no el catálogo final aprobado

---

**Research date:** 2026-03-22
**Válido para:** Phase 1 — catálogo estático TypeScript (no hay versioning externo que lo invalide)
