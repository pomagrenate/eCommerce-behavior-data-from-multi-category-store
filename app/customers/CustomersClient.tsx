"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import type { DataDerivedPersona, PersonaJourneyItem } from "@/lib/types";

interface Props {
  personas: DataDerivedPersona[];
  journeys: Record<string, PersonaJourneyItem[]>;
}

const TIER_COLORS: Record<string, string> = {
  window_shopper: "border-slate-500/40 bg-slate-500/5",
  intent_shopper:  "border-cyan-500/40 bg-cyan-500/5",
  hesitant_buyer:  "border-rose-500/40 bg-rose-500/5",
  focused_buyer:   "border-emerald-500/40 bg-emerald-500/5",
  explorer:        "border-violet-500/40 bg-violet-500/5",
  heavy_browser:   "border-amber-500/40 bg-amber-500/5",
};

const EVENT_COLORS: Record<string, string> = {
  VIEW:     "bg-indigo-600/80 text-white",
  CART:     "bg-cyan-600/80 text-white",
  REMOVE:   "bg-rose-600/80 text-white",
  PURCHASE: "bg-emerald-600/80 text-white",
  EXIT:     "bg-slate-700 text-slate-300",
};

export default function CustomersClient({ personas, journeys }: Props) {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [comparePersona, setComparePersona] = useState<string | null>(null);
  const [view, setView] = useState<"explore" | "compare">("explore");

  const active = useMemo(() =>
    selectedPersona ? personas.find(p => p.persona_id === selectedPersona) : null,
    [personas, selectedPersona]
  );

  const compareActive = useMemo(() =>
    comparePersona ? personas.find(p => p.persona_id === comparePersona) : null,
    [personas, comparePersona]
  );

  const activeJourney = selectedPersona ? journeys[selectedPersona] || [] : [];
  const compareJourney = comparePersona ? journeys[comparePersona] || [] : [];

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-3">
        {(["explore", "compare"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={clsx("px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
              view === v
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-[#0d1526] text-slate-400 border border-[#1e2d4a] hover:text-slate-200"
            )}>
            {v === "explore" ? "🔍 Persona Explorer" : "⚖️ Persona Comparison"}
          </button>
        ))}
      </div>

      {/* PERSONA EXPLORER VIEW */}
      {view === "explore" && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Persona Cards */}
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
              Data-Derived Behavioral Archetypes (6 segments discovered)
            </p>
            {personas.map((p) => (
              <button key={p.persona_id}
                onClick={() => setSelectedPersona(p.persona_id === selectedPersona ? null : p.persona_id)}
                className={clsx(
                  "w-full text-left p-4 rounded-xl border transition-all space-y-2",
                  TIER_COLORS[p.persona_id],
                  selectedPersona === p.persona_id
                    ? "border-indigo-500 ring-1 ring-indigo-500/50"
                    : "hover:border-indigo-500/40"
                )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100">{p.name}</span>
                  <span className="text-xs font-mono text-indigo-400 font-bold">{p.population_share}%</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{p.description}</p>
                <div className="flex gap-3 text-[11px] font-mono text-slate-500">
                  <span>Conv: <strong className="text-slate-300">{p.overall_conversion_rate}%</strong></span>
                  <span>Remove: <strong className="text-rose-400">{p.cart_removal_rate}%</strong></span>
                  <span className={clsx("ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                    p.confidence === "HIGH" ? "bg-emerald-600/20 text-emerald-400" : "bg-amber-600/20 text-amber-400")}>
                    {p.confidence} confidence
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Persona Detail Panel */}
          {active ? (
            <div className="md:col-span-2 space-y-5">
              {/* Persona Profile */}
              <div className={clsx("card border space-y-4", TIER_COLORS[active.persona_id])}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Tier 2 — Inferred Behavioral Archetype</p>
                    <h2 className="text-xl font-extrabold text-slate-100">{active.name}</h2>
                    <p className="text-sm text-slate-300 mt-1 max-w-xl">{active.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-indigo-400 font-mono">{active.population_share}%</div>
                    <div className="text-xs text-slate-500">{(active.population_count / 1000000).toFixed(2)}M sessions</div>
                  </div>
                </div>

                {/* Behavioral Signature Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1e2d4a]">
                  {[
                    { label: "Median Views/Session",   value: active.median_views, color: "text-indigo-300" },
                    { label: "Events Before Cart",     value: active.median_events_before_cart, color: "text-cyan-300" },
                    { label: "Cart Removal Rate",      value: `${active.cart_removal_rate}%`, color: "text-rose-300" },
                    { label: "Conversion Rate",        value: `${active.overall_conversion_rate}%`, color: "text-emerald-300" },
                    { label: "Session Duration (sec)", value: active.median_session_duration_sec, color: "text-violet-300" },
                    { label: "Category Breadth",       value: active.category_breadth, color: "text-amber-300" },
                    { label: "Brand Breadth",          value: active.brand_breadth, color: "text-indigo-300" },
                    { label: "View→Cart Rate",         value: `${active.view_to_cart_rate}%`, color: "text-cyan-300" },
                  ].map(m => (
                    <div key={m.label} className="bg-[#090f1d] p-3 rounded-lg border border-[#1e2d4a] text-center">
                      <div className={clsx("text-base font-black font-mono", m.color)}>{m.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Primary Friction */}
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                  <span className="font-bold text-rose-300">Primary Friction: </span>
                  {active.primary_friction}
                </div>
              </div>

              {/* Journey Sequence Flows */}
              <div className="card space-y-4">
                <div>
                  <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Tier 1 — Observed Session Sequences</p>
                  <h3 className="text-sm font-semibold text-slate-200">Top Observed Session Journey Sequences</h3>
                </div>
                <div className="space-y-3">
                  {activeJourney.map((j, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#090f1d] border border-[#1e2d4a] space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>#{idx + 1} · {j.frequency.toLocaleString()} sessions ({j.share_pct}%)</span>
                        <span className={clsx("font-bold px-2 py-0.5 rounded text-[10px] uppercase",
                          j.outcome === "PURCHASE" ? "bg-emerald-600/20 text-emerald-400" : "bg-slate-700 text-slate-400")}>
                          Outcome: {j.outcome}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {j.sequence.map((step, si) => (
                          <div key={si} className="flex items-center gap-1.5">
                            <span className={clsx("px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono", EVENT_COLORS[step])}>
                              {step}
                            </span>
                            {si < j.sequence.length - 1 && (
                              <span className="text-slate-600 text-xs">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center justify-center h-64 border border-dashed border-[#1e2d4a] rounded-xl text-slate-600 text-sm">
              ← Select a persona to explore its behavioral signature and journey sequences
            </div>
          )}
        </div>
      )}

      {/* PERSONA COMPARISON VIEW */}
      {view === "compare" && (
        <div className="space-y-5">
          {/* Selectors */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Persona A", value: selectedPersona, setter: setSelectedPersona },
              { label: "Persona B", value: comparePersona, setter: setComparePersona },
            ].map(({ label, value, setter }) => (
              <div key={label} className="card space-y-2">
                <p className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-bold">{label}</p>
                <select
                  value={value || ""}
                  onChange={e => setter(e.target.value || null)}
                  className="w-full bg-[#090f1d] border border-[#1e2d4a] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
                  <option value="">Select Persona…</option>
                  {personas.map(p => (
                    <option key={p.persona_id} value={p.persona_id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          {active && compareActive && (
            <div className="card overflow-x-auto">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Behavioral Feature Comparison</h3>
              <table className="w-full text-sm data-table">
                <thead>
                  <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4 text-right text-cyan-300">{active.name}</th>
                    <th className="py-3 px-4 text-right text-violet-300">{compareActive.name}</th>
                    <th className="py-3 px-4 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d4a]">
                  {[
                    { label: "Conversion Rate (%)",    a: active.overall_conversion_rate,    b: compareActive.overall_conversion_rate,    fmt: (v: number) => `${v}%` },
                    { label: "View→Cart Rate (%)",     a: active.view_to_cart_rate,          b: compareActive.view_to_cart_rate,          fmt: (v: number) => `${v}%` },
                    { label: "Cart Removal Rate (%)",  a: active.cart_removal_rate,          b: compareActive.cart_removal_rate,          fmt: (v: number) => `${v}%` },
                    { label: "Median Views/Session",   a: active.median_views,              b: compareActive.median_views,              fmt: (v: number) => `${v}` },
                    { label: "Median Session Depth",   a: active.median_session_depth,      b: compareActive.median_session_depth,      fmt: (v: number) => `${v}` },
                    { label: "Events Before Cart",     a: active.median_events_before_cart, b: compareActive.median_events_before_cart, fmt: (v: number) => `${v}` },
                    { label: "Session Duration (sec)", a: active.median_session_duration_sec, b: compareActive.median_session_duration_sec, fmt: (v: number) => `${v}s` },
                    { label: "Category Breadth",       a: active.category_breadth,          b: compareActive.category_breadth,          fmt: (v: number) => `${v}` },
                    { label: "Brand Breadth",          a: active.brand_breadth,             b: compareActive.brand_breadth,             fmt: (v: number) => `${v}` },
                    { label: "Population Share (%)",   a: active.population_share,          b: compareActive.population_share,          fmt: (v: number) => `${v}%` },
                  ].map(row => {
                    const delta = row.a - row.b;
                    return (
                      <tr key={row.label} className="hover:bg-[#131f37] transition-colors">
                        <td className="py-3 px-4 text-slate-300 font-medium">{row.label}</td>
                        <td className="py-3 px-4 text-right font-mono text-cyan-300 font-bold">{row.fmt(row.a)}</td>
                        <td className="py-3 px-4 text-right font-mono text-violet-300 font-bold">{row.fmt(row.b)}</td>
                        <td className={clsx("py-3 px-4 text-right font-mono text-sm font-bold",
                          delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-500")}>
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
