"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLoadContext } from "./LoadContext";

/**
 * Gráficas de ATL/CTL/ACWR y carga diaria.
 */
export default function GraficoCargas() {
  const { metricas } = useLoadContext();
  const data = metricas.tendencia.map((p) => ({
    date: p.date.slice(5),
    load: Number(p.load.toFixed(1)),
    atl: Number(p.atl.toFixed(1)),
    ctl: Number(p.ctl.toFixed(1)),
    acwr: p.acwr ? Number(p.acwr.toFixed(2)) : null,
  }));

  if (!data.length) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-sm text-gray-500">
        No hay datos para graficar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Carga aguda vs carga crónica</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="atl" stroke="#2563eb" dot={false} />
              <Line type="monotone" dataKey="ctl" stroke="#16a34a" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Carga diaria y ratio ACWR</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="load" stroke="#7c3aed" fill="#ede9fe" name="Carga" />
              <Line type="monotone" dataKey="acwr" stroke="#f59e0b" dot={false} name="ACWR" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
