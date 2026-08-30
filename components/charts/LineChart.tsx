"use client";
import {
  ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";

interface Series { key: string; color: string; label?: string; }

interface Props {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  tickFormatter?: (v: unknown) => string;
  yFormatter?: (v: unknown) => string;
}

const CustomTooltip = ({ active, payload, label, yFormatter }: {
  active?: boolean; payload?: {color: string; name: string; value: number}[];
  label?: string; yFormatter?: (v: unknown) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111c32] border border-[#1e2d4a] rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-slate-100">
            {yFormatter ? yFormatter(p.value) : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function LineChart({ data, xKey, series, height = 300, tickFormatter, yFormatter }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
        <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={tickFormatter as ((v: unknown) => string) | undefined} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={yFormatter as ((v: unknown) => string) | undefined}
          width={60} />
        <Tooltip content={<CustomTooltip yFormatter={yFormatter} />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label ?? s.key}
            stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
