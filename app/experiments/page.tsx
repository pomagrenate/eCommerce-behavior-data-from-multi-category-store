import { getExperimentsMetrics } from "@/lib/data";

export default function ExperimentsPage() {
  const experiments = getExperimentsMetrics();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-6">
      <div>
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Hypothesis Engine</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Experiment Testing Roadmap</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          10 structured hypothesis testing specifications translating behavioral signals into actionable A/B experiments.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(experiments || []).map((exp) => (
          <div key={exp.id} className="card border border-[#1e2d4a] hover:border-indigo-500/50 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="badge border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-[10px] uppercase font-bold">
                {exp.id}
              </span>
              <span className="text-xs text-slate-500 font-mono">Effort: {exp.effort}</span>
            </div>

            <h3 className="text-base font-bold text-slate-100">{exp.name}</h3>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="bg-[#090f1d] p-2.5 rounded border border-[#1e2d4a]/50">
                <span className="text-slate-500 font-semibold block mb-0.5">Hypothesis:</span>
                <p className="text-slate-300">{exp.hypothesis}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-slate-500">Target: </span>
                  <span className="text-slate-300 font-mono">{exp.target}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Lift: </span>
                  <span className="font-bold text-emerald-400 font-mono">{exp.expected_lift}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
