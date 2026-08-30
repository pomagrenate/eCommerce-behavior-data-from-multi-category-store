import { getFunnelMetrics, fmt, fmtPct } from "@/lib/data";
import FunnelClient from "./FunnelClient";

export default function FunnelPage() {
  const funnel = getFunnelMetrics();
  return (
    <div className="p-6 md:p-8 max-w-screen-xl">
      <div className="mb-8">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Analysis</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Purchase Funnel</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Where do customers drop out? Three funnel perspectives: raw event counts, unique users, and unique sessions.
          Each tells a different part of the story.
        </p>
      </div>

      {/* Cart abandonment highlight */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card border border-[#1e2d4a] col-span-1">
          <div className="text-xs text-slate-500 mb-1">Cart Abandonment Rate</div>
          <div className="text-4xl font-bold text-rose-400 metric-value">
            {fmtPct(funnel.cart_abandonment?.abandonment_rate ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            of sessions with a cart event did not complete a purchase
          </p>
        </div>
        <div className="card border border-[#1e2d4a]">
          <div className="text-xs text-slate-500 mb-1">Sessions with Cart</div>
          <div className="text-2xl font-bold text-cyan-400 metric-value">
            {fmt(funnel.cart_abandonment?.sessions_with_cart ?? 0)}
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>→ Completed purchase</span>
              <span className="text-emerald-400">{fmt(funnel.cart_abandonment?.cart_to_purchase ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>→ Removed from cart</span>
              <span className="text-amber-400">{fmt(funnel.cart_abandonment?.cart_then_removed ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>→ Abandoned (no action)</span>
              <span className="text-rose-400">{fmt(funnel.cart_abandonment?.cart_abandoned_no_action ?? 0)}</span>
            </div>
          </div>
        </div>
        <div className="card border border-[#1e2d4a]">
          <div className="text-xs text-slate-500 mb-2">Interpretation</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cart abandonment is the <strong className="text-slate-200">dominant funnel loss point</strong>.
            The majority of users who show purchase intent (adding to cart) ultimately do not convert.
            This signals friction in the checkout experience or price sensitivity.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Note: sessions can include both cart + remove events; they are not mutually exclusive.
          </p>
        </div>
      </div>

      <FunnelClient funnel={funnel} />
    </div>
  );
}
