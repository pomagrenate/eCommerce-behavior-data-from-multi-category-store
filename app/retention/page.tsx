import { getRetentionMetrics } from "@/lib/data";
import RetentionClient from "./RetentionClient";

export default function RetentionPage() {
  const retention = getRetentionMetrics();
  return (
    <div className="p-6 md:p-8 max-w-screen-xl">
      <div className="mb-8">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Cohort Analysis</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Retention & Repeat Behavior</h1>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 max-w-2xl">
          <p className="text-amber-300 text-xs font-semibold mb-1">⚠ Analytical Limitation</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            {retention.limitation_note ?? "Dataset covers only 2 months. Multi-month cohort retention curves are not statistically meaningful."}
            {" "}The cohort table shows Oct→Nov cross-month return rates and repeat purchase behavior within the dataset window.
          </p>
        </div>
      </div>
      <RetentionClient retention={retention} />
    </div>
  );
}
