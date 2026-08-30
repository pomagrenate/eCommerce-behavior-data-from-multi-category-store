"use client";
import { useState } from "react";
import clsx from "clsx";
import type { FunnelMetrics } from "@/lib/types";

interface Props { funnel: FunnelMetrics; }

type Mode = "event_based" | "user_based" | "session_based";

const MODES: { key: Mode; label: string; desc: string }[] = [
  { key: "event_based",   label: "Event-Based",   desc: "Raw event counts. One user can generate many view events." },
  { key: "user_based",    label: "User-Based",     desc: "Unique user IDs at each stage. Best for retention insight." },
  { key: "session_based", label: "Session-Based",  desc: "Unique sessions at each stage. Best for journey analysis." },
];

const STAGES = [
  { key: "views",     uKey: "users_viewed",   sKey: "sessions_viewed",   label: "VIEW",     color: "#6366f1", bg: "bg-indigo-600" },
  { key: "carts",     uKey: "users_carted",   sKey: "sessions_carted",   label: "CART",     color: "#06b6d4", bg: "bg-cyan-600" },
  { key: "purchases", uKey: "users_purchased",sKey: "sessions_purchased", label: "PURCHASE", color: "#10b981", bg: "bg-emerald-600" },
];

export default function FunnelClient({ funnel }: Props) {
  const [mode, setMode] = useState<Mode>("session_based");

  const data = funnel[mode];
  const getVal = (stage: typeof STAGES[0]): number => {
    const d = data as unknown as Record<string, number>;
    if (mode === "event_based")   return d[stage.key] ?? 0;
    if (mode === "user_based")    return d[stage.uKey] ?? 0;
    return d[stage.sKey] ?? 0;
  };


  const vals = STAGES.map(getVal);
  const maxVal = vals[0] || 1;

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                mode === m.key
                  ? "bg-indigo-600 text-white"
                  : "bg-[#0d1526] text-slate-400 hover:text-slate-200 border border-[#1e2d4a]"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {MODES.find((m) => m.key === mode)?.desc}
        </p>
      </div>

      {/* Funnel visualization */}
      <div className="card space-y-4">
        {STAGES.map((stage, i) => {
          const val = vals[i];
          const pct = (val / maxVal) * 100;
          const dropPct = i > 0 ? ((vals[i - 1] - val) / vals[i - 1]) * 100 : 0;
          const convPct = i > 0 ? (val / vals[i - 1]) * 100 : 100;

          return (
            <div key={stage.key}>
              {i > 0 && (
                <div className="flex items-center gap-3 py-1 text-xs text-slate-500">
                  <div className="flex-1 border-l-2 border-dashed border-[#1e2d4a] ml-4 pl-3">
                    <span className="text-rose-400 font-medium">−{dropPct.toFixed(1)}% drop-off</span>
                    <span className="ml-3 text-emerald-400">→ {convPct.toFixed(1)}% continued</span>
                  </div>
                </div>
              )}
              <div className="relative">
                <div
                  className={clsx("funnel-bar", stage.bg)}
                  style={{ width: `${Math.max(pct, 3)}%`, opacity: 0.85 }}
                >
                  <span className="text-white font-semibold text-sm">{stage.label}</span>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-right">
                  <div className="text-lg font-bold text-slate-100 metric-value">{val.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">
                    {i === 0 ? "100%" : `${convPct.toFixed(2)}% of top`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rate cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "View → Cart Rate",         val: data.view_to_cart_rate,     color: "text-cyan-400" },
          { label: "Cart → Purchase Rate",     val: data.cart_to_purchase_rate, color: "text-emerald-400" },
          { label: "Overall Conversion Rate",  val: data.overall_conversion,    color: "text-indigo-400" },
        ].map((r) => (
          <div key={r.label} className="card text-center">
            <div className="text-xs text-slate-500 mb-2">{r.label}</div>
            <div className={clsx("text-3xl font-bold metric-value", r.color)}>
              {(r.val ?? 0).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
