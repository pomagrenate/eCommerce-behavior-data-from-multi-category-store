import clsx from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "indigo" | "violet" | "cyan" | "emerald" | "amber" | "rose";
  trend?: number; // positive = good
}

const ACCENT_COLORS: Record<string, string> = {
  blue:    "text-blue-400 border-blue-500/20 bg-blue-500/5",
  indigo:  "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
  violet:  "text-violet-400 border-violet-500/20 bg-violet-500/5",
  cyan:    "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
  emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  amber:   "text-amber-400 border-amber-500/20 bg-amber-500/5",
  rose:    "text-rose-400 border-rose-500/20 bg-rose-500/5",
};

export default function KPICard({ label, value, sub, accent = "indigo", trend }: Props) {
  return (
    <div className={clsx("card border flex flex-col gap-1", ACCENT_COLORS[accent])}>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold metric-value text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
      {trend !== undefined && (
        <div className={clsx("text-xs font-medium mt-1 flex items-center gap-1", trend >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{Math.abs(trend).toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}
