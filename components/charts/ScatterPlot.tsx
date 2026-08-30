"use client";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ZAxis, ReferenceLine
} from "recharts";

interface DataPoint {
  x: number;
  y: number;
  z?: number;
  label?: string;
}

interface Props {
  data: DataPoint[];
  xLabel?: string;
  yLabel?: string;
  xFormatter?: (v: number) => string;
  yFormatter?: (v: number) => string;
  height?: number;
  referenceX?: number;
  referenceY?: number;
}

const CustomTooltip = ({ active, payload, xFormatter, yFormatter, xLabel, yLabel }: {
  active?: boolean; payload?: { value: number; name: string; payload?: unknown }[];
  xFormatter?: (v: number) => string; yFormatter?: (v: number) => string;
  xLabel?: string; yLabel?: string;
}) => {

  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as DataPoint & { label?: string };
  return (
    <div className="bg-[#111c32] border border-[#1e2d4a] rounded-lg p-3 text-sm shadow-xl max-w-[200px]">
      {item?.label && <p className="font-semibold text-slate-200 mb-2 truncate">{item.label}</p>}
      <p className="text-slate-400">{xLabel ?? "X"}: <span className="text-slate-200 font-medium">
        {xFormatter ? xFormatter(item?.x) : item?.x?.toLocaleString()}
      </span></p>
      <p className="text-slate-400">{yLabel ?? "Y"}: <span className="text-slate-200 font-medium">
        {yFormatter ? yFormatter(item?.y) : item?.y?.toLocaleString()}
      </span></p>
    </div>
  );
};

export default function ScatterPlot({
  data, xLabel, yLabel, xFormatter, yFormatter, height = 350,
  referenceX, referenceY
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
        <XAxis type="number" dataKey="x" name={xLabel} tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={xFormatter as ((v: unknown) => string) | undefined}
          label={{ value: xLabel, position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name={yLabel} tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={yFormatter as ((v: unknown) => string) | undefined}
          width={60} />
        <ZAxis dataKey="z" range={[20, 200]} />
        <Tooltip content={
          <CustomTooltip xFormatter={xFormatter} yFormatter={yFormatter} xLabel={xLabel} yLabel={yLabel} />
        } />
        {referenceX !== undefined && (
          <ReferenceLine x={referenceX} stroke="#475569" strokeDasharray="4 4" />
        )}
        {referenceY !== undefined && (
          <ReferenceLine y={referenceY} stroke="#475569" strokeDasharray="4 4" />
        )}
        <Scatter data={data} fill="#6366f1" fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
