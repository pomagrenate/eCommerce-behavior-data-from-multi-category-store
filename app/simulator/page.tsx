import { getPersonas, getMarkovTransitions, getSimulatorBaselines } from "@/lib/data";
import SimulatorClient from "./SimulatorClient";

export default function SimulatorPage() {
  const personas = getPersonas();
  const markov = getMarkovTransitions();
  const baselines = getSimulatorBaselines();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-6">
      <div className="border-b border-[#1e2d4a] pb-6">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Decision Support System · Tier 3 — Simulated</p>
        <h1 className="text-3xl font-extrabold text-slate-100 mb-2">
          CEO Business Intervention Simulator
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Select a customer persona, choose a behavioral intervention, set a relative lift, and observe
          what-if scenario impacts on purchases, conversion, and simulated purchase value.
          All calculations are deterministic expected-value simulations from historical Markov
          transition probabilities — not causal forecasts.
        </p>
      </div>
      <SimulatorClient personas={personas} markov={markov} baselines={baselines} />
    </div>
  );
}
