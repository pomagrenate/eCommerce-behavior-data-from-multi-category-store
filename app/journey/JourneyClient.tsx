"use client";
import clsx from "clsx";
import type { JourneyMetrics } from "@/lib/types";

interface Props { journey: JourneyMetrics; }

const EVENT_COLORS: Record<string, string> = {
  view:             "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
  cart:             "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",
  purchase:         "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
  remove_from_cart: "bg-rose-600/20 text-rose-300 border-rose-600/30",
};

const JOURNEY_COLORS: Record<string, string> = {
  "view→cart→purchase": "border-emerald-500/30 bg-emerald-500/5",
  "view→cart (abandoned)": "border-rose-500/30 bg-rose-500/5",
  "view→cart→remove": "border-amber-500/30 bg-amber-500/5",
  "view only": "border-slate-600/30 bg-slate-700/5",
};

export default function JourneyClient({ journey }: Props) {
  const totalSessions = journey.session_types?.reduce((s, j) => s + j.sessions, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Session type breakdown */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Session Type Distribution</h3>
        <div className="space-y-3">
          {journey.session_types?.map((st) => {
            const pct = (st.sessions / totalSessions) * 100;
            const colorClass = JOURNEY_COLORS[st.journey_type] ?? "border-slate-600/30 bg-slate-700/5";
            return (
              <div key={st.journey_type} className={clsx("rounded-lg border p-4", colorClass)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm font-medium text-slate-200">{st.journey_type}</div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-100 metric-value">{st.sessions.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs ml-2">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full bg-[#0d1526] rounded-full h-1.5 mb-2">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>avg {st.avg_events?.toFixed(1)} events/session</span>
                  <span>avg {st.avg_views?.toFixed(1)} views</span>
                  <span>avg {st.avg_carts?.toFixed(1)} carts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event transitions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Event Transition Matrix</h3>
        <p className="text-xs text-slate-500 mb-4">How often one event type leads to another within the same session</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr>
                <th className="text-left">From → To</th>
                <th className="text-right">Transitions</th>
                <th className="text-right w-40">Share</th>
              </tr>
            </thead>
            <tbody>
              {journey.transitions?.map((t, i) => {
                const maxT = journey.transitions[0]?.transitions || 1;
                const pct = (t.transitions / maxT) * 100;
                return (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={clsx("badge border text-[10px]", EVENT_COLORS[t.from_event] ?? "bg-slate-700 text-slate-300 border-slate-600")}>
                          {t.from_event}
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className={clsx("badge border text-[10px]", EVENT_COLORS[t.to_event] ?? "bg-slate-700 text-slate-300 border-slate-600")}>
                          {t.to_event}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-mono">{t.transitions.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-24 bg-[#0d1526] rounded-full h-1">
                          <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top sequences */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Top Session Sequences</h3>
        <p className="text-xs text-slate-500 mb-4">First 5 events per session. Sorted by frequency.</p>
        <div className="space-y-2">
          {journey.top_sequences?.slice(0, 20).map((seq, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1e2d4a] last:border-0">
              <span className="text-xs text-slate-600 w-5 text-right">{i + 1}</span>
              <div className="flex-1">
                <div className="flex flex-wrap gap-1">
                  {seq.sequence.split("→").map((e, j) => (
                    <span key={j} className={clsx("badge border text-[10px]", EVENT_COLORS[e] ?? "bg-slate-700 text-slate-300 border-slate-600")}>
                      {e === "remove_from_cart" ? "remove" : e}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-200 font-mono">{seq.frequency.toLocaleString()}</div>
                <div className={clsx(seq.conversion_pct > 0 ? "text-emerald-400" : "text-slate-500")}>
                  {seq.conversion_pct.toFixed(1)}% conv
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
