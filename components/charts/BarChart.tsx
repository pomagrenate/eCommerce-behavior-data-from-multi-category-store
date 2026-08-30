"use client";
import {
  ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from "recharts";

interface Props {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  yFormatter?: (v: unknown) => string;
  xFormatter?: (v: unknown) => string;
}

const CustomTooltip = ({ active, payload, label, yFormatter }: {
  active?: boolean; payload?: {value: number; fill: string}[];
  label?: string; yFormatter?: (v: unknown) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111c32] border border-[#1e2d4a] rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-slate-100">
        {yFormatter ? yFormatter(payload[0].value) : payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export default function BarChart({ data, xKey, yKey, color = "#6366f1",
  height = 280, horizontal = false, yFormatter, xFormatter }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 16, bottom: 5, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={xFormatter as ((v: unknown) => string) | undefined} />
            <YAxis type="category" dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }} width={100} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={xFormatter as ((v: unknown) => string) | undefined} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={yFormatter as ((v: unknown) => string) | undefined} width={60} />
          </>
        )}
        <Tooltip content={<CustomTooltip yFormatter={yFormatter} />} />
        <Bar dataKey={yKey} fill={color} radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} fillOpacity={0.85 - i * 0.002} />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
