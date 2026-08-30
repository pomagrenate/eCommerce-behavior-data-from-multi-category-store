import { getOpportunitiesMetrics } from "@/lib/data";
import OpportunitiesClient from "./OpportunitiesClient";

export default function OpportunitiesPage() {
  const opportunities = getOpportunitiesMetrics();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-6">
      <div>
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Decision Support System</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Executive Business Opportunities</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Sizing, prioritizing, and modeling revenue opportunity scenarios based on empirical behavioral leakage points.
        </p>
      </div>

      <OpportunitiesClient opportunities={opportunities} />
    </div>
  );
}
