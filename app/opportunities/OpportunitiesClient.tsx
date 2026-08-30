"use client";
import { useState, useMemo } from "react";
import clsx from "clsx";
import type { OpportunityItem } from "@/lib/types";

interface Props {
  opportunities: OpportunityItem[];
}

export default function OpportunitiesClient({ opportunities }: Props) {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [scenarioMode, setScenarioMode] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  const categories = useMemo(() => {
    const set = new Set((opportunities || []).map(o => o.category));
    return ["All", ...Array.from(set)];
  }, [opportunities]);

  const filtered = useMemo(() => {
    if (filterCategory === "All") return opportunities || [];
    return (opportunities || []).filter(o => o.category === filterCategory);
  }, [opportunities, filterCategory]);

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0d1526] p-4 rounded-xl border border-[#1e2d4a]">
        {/* Category Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filterCategory === cat
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-[#131f37] text-slate-400 border border-[#1e2d4a] hover:text-slate-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scenario Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Scenario Valuation:</span>
          {(["conservative", "moderate", "aggressive"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setScenarioMode(mode)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                scenarioMode === mode
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-[#131f37] text-slate-400 border border-[#1e2d4a] hover:text-slate-200"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunity Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((opp) => {
          const val =
            scenarioMode === "conservative"
              ? opp.conservative_val
              : scenarioMode === "aggressive"
              ? opp.aggressive_val
              : opp.moderate_val;

          return (
            <div key={opp.id} className="card border border-[#1e2d4a] hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="badge border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-mono text-[10px] uppercase font-bold">
                    {opp.id} · {opp.priority}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{opp.category}</span>
                </div>

                <h3 className="text-base font-bold text-slate-100 mb-2">{opp.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{opp.evidence}</p>

                <div className="bg-[#090f1d] p-3 rounded-lg border border-[#1e2d4a]/50 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-indigo-300">Recommended Executive Action:</div>
                  <div>{opp.action}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e2d4a] flex items-center justify-between text-xs">
                <div className="flex gap-2 font-mono">
                  <span className="text-slate-500">Impact: <strong className="text-slate-200">{opp.impact}</strong></span>
                  <span className="text-slate-500">Conf: <strong className="text-slate-200">{opp.confidence}</strong></span>
                  <span className="text-slate-500">Effort: <strong className="text-slate-200">{opp.effort}</strong></span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">{scenarioMode} Opportunity</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">{val}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
