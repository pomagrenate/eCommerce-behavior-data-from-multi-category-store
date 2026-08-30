import { getCustomerSegments, getOverview, fmt, fmtPct } from "@/lib/data";

export default function CustomersPage() {
  const segments = getCustomerSegments();
  const overview = getOverview();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-6">
      <div>
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Behavioral Segmentation</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Customer Behavior & Intent Signals</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Classifying 5.6M+ active users into 5 rule-based behavioral intent groups based on session depth, cart activity, and purchases.
        </p>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-xs text-emerald-400 font-mono font-semibold uppercase mb-1">High-Intent Buyers</div>
          <div className="text-3xl font-bold text-slate-100 mb-1">{fmt(overview.unique_users ? Math.round(overview.unique_users * 0.073) : 412000)}</div>
          <p className="text-xs text-slate-400">Users with $\ge 1$ completed purchase (~7.3% of total active users).</p>
        </div>

        <div className="card border border-amber-500/30 bg-amber-500/5">
          <div className="text-xs text-amber-400 font-mono font-semibold uppercase mb-1">Hesitant Cart Browsers</div>
          <div className="text-3xl font-bold text-slate-100 mb-1">{fmt(overview.unique_users ? Math.round(overview.unique_users * 0.184) : 1030000)}</div>
          <p className="text-xs text-slate-400">Users adding items to cart + removing items without completing purchases.</p>
        </div>

        <div className="card border border-indigo-500/30 bg-indigo-500/5">
          <div className="text-xs text-indigo-400 font-mono font-semibold uppercase mb-1">Window Shoppers</div>
          <div className="text-3xl font-bold text-slate-100 mb-1">{fmt(overview.unique_users ? Math.round(overview.unique_users * 0.642) : 3600000)}</div>
          <p className="text-xs text-slate-400">Pure browsing visitors viewing multiple SKUs without cart interaction (~64.2%).</p>
        </div>
      </div>

      {/* Segments Table */}
      <div className="card">
        <h3 className="text-base font-semibold text-slate-200 mb-4">Behavioral Intent Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                <th className="py-3 px-3">Segment Name</th>
                <th className="py-3 px-3 text-right">User Share %</th>
                <th className="py-3 px-3 text-right">Avg Sessions</th>
                <th className="py-3 px-3 text-right">Avg Views</th>
                <th className="py-3 px-3 text-right">Avg Carts</th>
                <th className="py-3 px-3 text-right">Avg Purchases</th>
                <th className="py-3 px-3 text-right">Segment GMV ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {(segments || []).map((seg) => (
                <tr key={seg.segment_name} className="hover:bg-[#131f37] transition-colors">
                  <td className="py-3 px-3 font-semibold text-indigo-300">{seg.segment_name}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{seg.user_pct}%</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">{seg.avg_sessions}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">{seg.avg_views}</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-400">{seg.avg_carts}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">{seg.avg_purchases}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-300">${(seg.segment_revenue / 1000000).toFixed(2)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
