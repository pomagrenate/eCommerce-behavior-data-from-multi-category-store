import { getPricingMetrics, fmt, fmtPct } from "@/lib/data";

export default function PricingPage() {
  const pricing = getPricingMetrics();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-6">
      <div>
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Price Intelligence</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Price Sensitivity & Price Band Analysis</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Analyzing how listed product pricing impacts cart addition rate, purchase conversion, and cart removals across 5 price tiers.
        </p>
      </div>

      {/* Price Bands Grid */}
      <div className="grid md:grid-cols-5 gap-3">
        {(pricing || []).map((pb) => (
          <div key={pb.price_band} className="card border border-[#1e2d4a]">
            <div className="text-[11px] font-mono text-indigo-400 font-semibold mb-1">{pb.price_band}</div>
            <div className="text-xl font-bold text-slate-100 mb-1">${(pb.revenue / 1000000).toFixed(2)}M</div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <div>View→Cart: <span className="text-cyan-400 font-mono">{pb.view_to_cart_pct}%</span></div>
              <div>Cart→Purchase: <span className="text-emerald-400 font-mono">{pb.cart_to_purchase_pct}%</span></div>
              <div>Overall Conv: <span className="text-amber-300 font-mono">{pb.overall_conversion_pct}%</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Pricing Table */}
      <div className="card space-y-4">
        <h3 className="text-base font-semibold text-slate-200">Price Band Performance Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                <th className="py-3 px-3">Price Band</th>
                <th className="py-3 px-3 text-right">Total Events</th>
                <th className="py-3 px-3 text-right">Views</th>
                <th className="py-3 px-3 text-right">Carts</th>
                <th className="py-3 px-3 text-right">Purchases</th>
                <th className="py-3 px-3 text-right">Removes</th>
                <th className="py-3 px-3 text-right">Revenue ($)</th>
                <th className="py-3 px-3 text-right">View→Cart %</th>
                <th className="py-3 px-3 text-right">Cart→Purchase %</th>
                <th className="py-3 px-3 text-right">Overall Conv %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {(pricing || []).map((pb) => (
                <tr key={pb.price_band} className="hover:bg-[#131f37] transition-colors">
                  <td className="py-3 px-3 font-semibold text-indigo-300">{pb.price_band}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">{pb.total_events?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">{pb.views?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-400">{pb.carts?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">{pb.purchases?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-400">{pb.removes?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-300">${(pb.revenue / 1000000).toFixed(2)}M</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-400">{pb.view_to_cart_pct}%</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">{pb.cart_to_purchase_pct}%</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">{pb.overall_conversion_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
