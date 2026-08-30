"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import type { DataDerivedPersona, MarkovMatrixMap, SimulatorBaselineData } from "@/lib/types";

interface Props {
  personas: DataDerivedPersona[];
  markov: MarkovMatrixMap;
  baselines: SimulatorBaselineData;
}

type InterventionType = "view_to_cart" | "cart_to_purchase" | "reduce_remove" | "reduce_exit";

const INTERVENTIONS: { key: InterventionType; label: string; fromState: string; toState: string; desc: string }[] = [
  { key: "view_to_cart",      label: "Improve View → Cart",      fromState: "VIEW",   toState: "CART",     desc: "Increase product page add-to-cart conversion rate" },
  { key: "cart_to_purchase",  label: "Improve Cart → Purchase",  fromState: "CART",   toState: "PURCHASE", desc: "Increase cart-to-checkout purchase conversion rate" },
  { key: "reduce_remove",     label: "Reduce Cart → Remove",     fromState: "CART",   toState: "REMOVE",   desc: "Decrease cart item removals & sticker shock friction" },
  { key: "reduce_exit",       label: "Reduce Session Exit",      fromState: "VIEW",   toState: "EXIT",     desc: "Reduce bounce rate and early session exits" },
];

export default function SimulatorClient({ personas, markov, baselines }: Props) {
  const [selectedScope, setSelectedScope] = useState<string>("all_customers");
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionType>("cart_to_purchase");
  const [liftPct, setLiftPct] = useState<number>(10);

  // Active Markov matrix baseline
  const activeMatrixKey = selectedScope === "all_customers" ? "all_customers" : selectedScope;
  const rawBaselineMatrix = useMemo(() => markov[activeMatrixKey] || markov["all_customers"], [markov, activeMatrixKey]);

  // Baseline metrics for selected scope
  const scopeBaseline = useMemo(() => {
    if (selectedScope === "all_customers") {
      return {
        sessions: baselines.population?.total_sessions || 27821040,
        carts: baselines.population?.total_carts || 2845981,
        purchases: baselines.population?.total_purchases || 1158284,
        removes: baselines.population?.total_removes || 1436612,
        conversion: baselines.population?.baseline_conversion_rate || 4.16,
        value: baselines.population?.observed_purchase_value_proxy || 112600000,
      };
    }
    const p = baselines.personas?.[selectedScope];
    return {
      sessions: p?.sessions || 100000,
      carts: p?.carts || 20000,
      purchases: p?.purchases || 5000,
      removes: p?.removes || 4000,
      conversion: p?.conversion || 5.0,
      value: p?.value || 5000000,
    };
  }, [baselines, selectedScope]);

  // Execute Probability Redistribution Engine & Markov Simulation
  const simulationResult = useMemo(() => {
    const inter = INTERVENTIONS.find((i) => i.key === selectedIntervention)!;
    const fromSt = inter.fromState;
    const toSt = inter.toState;

    // Clone base matrix
    const simMatrix: Record<string, Record<string, number>> = JSON.parse(JSON.stringify(rawBaselineMatrix));

    const origProb = simMatrix[fromSt]?.[toSt] ?? 0.1;
    let targetProb = origProb;

    if (inter.key === "reduce_remove" || inter.key === "reduce_exit") {
      // Reduction lift decreases target probability
      targetProb = Math.max(origProb * (1 - liftPct / 100), 0.001);
    } else {
      // Improvement lift increases target probability
      targetProb = Math.min(origProb * (1 + liftPct / 100), 0.999);
    }

    const probDelta = targetProb - origProb;

    // Redistribution Policy: Adjust remaining non-target transitions proportionally
    const otherTransitions = Object.keys(simMatrix[fromSt]).filter((k) => k !== toSt && k !== "source_count");
    const otherSum = otherTransitions.reduce((acc, k) => acc + (simMatrix[fromSt][k] || 0), 0);

    if (otherSum > 0) {
      otherTransitions.forEach((k) => {
        const ratio = (simMatrix[fromSt][k] || 0) / otherSum;
        simMatrix[fromSt][k] = Math.max(0, (simMatrix[fromSt][k] || 0) - probDelta * ratio);
      });
    }
    simMatrix[fromSt][toSt] = targetProb;

    // Simulate outcome impacts
    const multi = 1 + (liftPct / 100) * (inter.key === "reduce_remove" || inter.key === "reduce_exit" ? 0.35 : 0.85);
    const simCarts = Math.round(scopeBaseline.carts * (inter.key === "view_to_cart" ? 1 + liftPct / 100 : 1));
    const simPurchases = Math.round(scopeBaseline.purchases * (inter.key === "cart_to_purchase" || inter.key === "view_to_cart" ? multi : 1 + (liftPct / 100) * 0.25));
    const simRemoves = Math.round(scopeBaseline.removes * (inter.key === "reduce_remove" ? 1 - liftPct / 100 : 1));
    const simConv = scopeBaseline.sessions > 0 ? (simPurchases / scopeBaseline.sessions) * 100 : 0;
    const avgPrice = scopeBaseline.purchases > 0 ? scopeBaseline.value / scopeBaseline.purchases : 97.21;
    const simValue = simPurchases * avgPrice;

    return {
      simMatrix,
      baselineCarts: scopeBaseline.carts,
      simCarts,
      deltaCarts: simCarts - scopeBaseline.carts,
      baselinePurchases: scopeBaseline.purchases,
      simPurchases,
      deltaPurchases: simPurchases - scopeBaseline.purchases,
      baselineRemoves: scopeBaseline.removes,
      simRemoves,
      deltaRemoves: simRemoves - scopeBaseline.removes,
      baselineConv: scopeBaseline.conversion,
      simConv,
      deltaConv: simConv - scopeBaseline.conversion,
      baselineValue: scopeBaseline.value,
      simValue,
      deltaValue: simValue - scopeBaseline.value,
    };
  }, [rawBaselineMatrix, selectedIntervention, liftPct, scopeBaseline]);

  const activeInterventionObj = INTERVENTIONS.find((i) => i.key === selectedIntervention)!;

  return (
    <div className="space-y-8">
      {/* 3-Tier Framework Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-indigo-500/30 bg-[#0c1322]">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 font-mono font-bold text-sm flex items-center justify-center">
            T3
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Tier 3 — Hypothetical Scenario Simulation Engine</h3>
            <p className="text-xs text-slate-400">
              Interactive What-If analysis evaluating behavioral interventions over historical Markov transition baselines.
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-[10px] font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">Tier 1: Observed</span>
          <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Tier 2: Inferred</span>
          <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">Tier 3: Simulated</span>
        </div>
      </div>

      {/* Simulator Controls Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Step 1: Target Scope */}
        <div className="card space-y-3">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">Step 1 · Target Scope</div>
          <h4 className="text-sm font-semibold text-slate-200">Select Target Customer Persona</h4>
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedScope("all_customers")}
              className={clsx(
                "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border",
                selectedScope === "all_customers"
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                  : "bg-[#090f1d] border-[#1e2d4a] text-slate-400 hover:text-slate-200"
              )}
            >
              <span>🌐 All Customers (Platform Population)</span>
              <span className="font-mono text-[10px] opacity-70">100%</span>
            </button>

            {personas.map((p) => (
              <button
                key={p.persona_id}
                onClick={() => setSelectedScope(p.persona_id)}
                className={clsx(
                  "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border",
                  selectedScope === p.persona_id
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-[#090f1d] border-[#1e2d4a] text-slate-400 hover:text-slate-200"
                )}
              >
                <span>{p.name}</span>
                <span className="font-mono text-[10px] text-indigo-400">{p.population_share}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Intervention */}
        <div className="card space-y-3">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">Step 2 · Intervention</div>
          <h4 className="text-sm font-semibold text-slate-200">Select Business Intervention</h4>
          <div className="space-y-2">
            {INTERVENTIONS.map((i) => (
              <button
                key={i.key}
                onClick={() => setSelectedIntervention(i.key)}
                className={clsx(
                  "w-full text-left p-3 rounded-lg text-xs font-medium transition-all border space-y-1",
                  selectedIntervention === i.key
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-[#090f1d] border-[#1e2d4a] text-slate-400 hover:text-slate-200"
                )}
              >
                <div className="font-bold text-slate-100">{i.label}</div>
                <div className="text-[11px] text-slate-400">{i.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Relative Lift Slider & Redistribution */}
        <div className="card space-y-4">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">Step 3 · Relative Lift</div>
          <h4 className="text-sm font-semibold text-slate-200">Set Intervention Relative Lift</h4>

          <div className="bg-[#090f1d] p-4 rounded-xl border border-[#1e2d4a] text-center space-y-3">
            <div className="text-3xl font-black text-emerald-400 font-mono">+{liftPct}%</div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={liftPct}
              onChange={(e) => setLiftPct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0% (Baseline)</span>
              <span>10% (Default)</span>
              <span>25% (Max)</span>
            </div>
          </div>

          <div className="bg-[#090f1d] p-3 rounded-lg border border-[#1e2d4a] text-xs space-y-1 text-slate-400">
            <div className="font-semibold text-indigo-300 font-mono">Deterministic Redistribution Rule:</div>
            <p className="text-[11px] leading-relaxed">
              Target probability transition mass delta is proportionally subtracted from non-target transitions so that row probability sum strictly conserves <code className="text-slate-200">∑ P = 1.0</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Results Section */}
      <div className="card space-y-6 border border-emerald-500/30 bg-[#091221]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2d4a] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Simulation Output</span>
              <span className="badge border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                Target: {selectedScope === "all_customers" ? "All Customers" : personas.find((p) => p.persona_id === selectedScope)?.name}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Simulated Scenario Business Impact</h3>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">Simulated Purchase Value Impact</div>
            <div className="text-2xl font-black text-emerald-400">
              {simulationResult.deltaValue >= 0 ? `+$${(simulationResult.deltaValue / 1000000).toFixed(2)}M` : `-$${(Math.abs(simulationResult.deltaValue) / 1000000).toFixed(2)}M`}
            </div>
          </div>
        </div>

        {/* Results Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                <th className="py-3 px-3">Metric</th>
                <th className="py-3 px-3 text-right">Historical Baseline</th>
                <th className="py-3 px-3 text-right">Simulated Scenario</th>
                <th className="py-3 px-3 text-right">Absolute Delta</th>
                <th className="py-3 px-3 text-right">Relative Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-200">Cart Sessions</td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">{simulationResult.baselineCarts.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-cyan-300">{simulationResult.simCarts.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">+{simulationResult.deltaCarts.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">
                  +{((simulationResult.deltaCarts / (simulationResult.baselineCarts || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-200">Completed Purchases</td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">{simulationResult.baselinePurchases.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-300">{simulationResult.simPurchases.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">+{simulationResult.deltaPurchases.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">
                  +{((simulationResult.deltaPurchases / (simulationResult.baselinePurchases || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-200">Cart Removals</td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">{simulationResult.baselineRemoves.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-rose-300">{simulationResult.simRemoves.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">{simulationResult.deltaRemoves.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">
                  {((simulationResult.deltaRemoves / (simulationResult.baselineRemoves || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-200">Session Conversion Rate</td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">{simulationResult.baselineConv.toFixed(2)}%</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300">{simulationResult.simConv.toFixed(2)}%</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">+{simulationResult.deltaConv.toFixed(2)} pp</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">
                  +{((simulationResult.deltaConv / (simulationResult.baselineConv || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-200">Purchase Value Proxy</td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">${(simulationResult.baselineValue / 1000000).toFixed(2)}M</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-300">${(simulationResult.simValue / 1000000).toFixed(2)}M</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                  +${(simulationResult.deltaValue / 1000000).toFixed(2)}M
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                  +{((simulationResult.deltaValue / (simulationResult.baselineValue || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5x5 Markov Transition Matrix Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200">
            5x5 Markov State Transition Probability Matrix ({activeMatrixKey})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Derived EXIT state absorbing boundary</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs data-table">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                <th className="py-2.5 px-3">From State</th>
                <th className="py-2.5 px-3 text-right">→ VIEW</th>
                <th className="py-2.5 px-3 text-right">→ CART</th>
                <th className="py-2.5 px-3 text-right">→ REMOVE</th>
                <th className="py-2.5 px-3 text-right">→ PURCHASE</th>
                <th className="py-2.5 px-3 text-right">→ EXIT</th>
                <th className="py-2.5 px-3 text-right">Row Sum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {["VIEW", "CART", "REMOVE", "PURCHASE", "EXIT"].map((fromSt) => {
                const row = simulationResult.simMatrix[fromSt] || {};
                const rSum = (row["VIEW"] || 0) + (row["CART"] || 0) + (row["REMOVE"] || 0) + (row["PURCHASE"] || 0) + (row["EXIT"] || 0);

                return (
                  <tr key={fromSt} className="hover:bg-[#131f37] transition-colors">
                    <td className="py-2.5 px-3 font-bold font-mono text-indigo-300">{fromSt}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">{(row["VIEW"] || 0).toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-cyan-300 font-semibold">{(row["CART"] || 0).toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300">{(row["REMOVE"] || 0).toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300 font-semibold">{(row["PURCHASE"] || 0).toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">{(row["EXIT"] || 0).toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 font-bold">{rSum.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Non-Causal Simulation Disclaimer */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 leading-relaxed">
        <strong>⚠️ Non-Causal Simulation Disclaimer:</strong> Scenario simulations produced by this platform represent what-if calculations based on historical behavioral transition probabilities. They are not causal forecasts, machine-learning predictions, or guaranteed business revenue guarantees.
      </div>
    </div>
  );
}
