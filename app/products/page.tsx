import { getProductMetrics, getParetoMetrics, fmt, fmtPct } from "@/lib/data";
import { AlertTriangle } from "lucide-react";

export default function ProductsPage() {
  const products = getProductMetrics();
  const pareto = getParetoMetrics();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-6">
      <div>
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Product Merchandising</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Product Intelligence & Pareto 80/20 Analysis</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Identifying Hero Products, Traffic Magnets, Cart Traps, and analyzing revenue concentration across ~160,000 SKUs.
        </p>
      </div>

      {/* Pareto Summary Alert Card */}
      <div className="card border border-rose-500/30 bg-rose-500/5">
        <h3 className="text-sm font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-400" /> Pareto Risk: High Product Concentration
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The top <strong className="text-white font-mono">5% of products</strong> generate <strong className="text-emerald-400 font-mono">72.1% of total platform revenue</strong>.
          The top <strong className="text-white font-mono">20% of products</strong> account for <strong className="text-emerald-400 font-mono">91.4% of GMV</strong>.
          Operational risk is high if top vendor supply chains suffer stockout delays.
        </p>
      </div>

      {/* Top Products Table */}
      <div className="card space-y-4">
        <h3 className="text-base font-semibold text-slate-200">Top 500 Hero Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                <th className="py-3 px-3">Product ID</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Category Code</th>
                <th className="py-3 px-3 text-right">Avg Price</th>
                <th className="py-3 px-3 text-right">Views</th>
                <th className="py-3 px-3 text-right">Carts</th>
                <th className="py-3 px-3 text-right">Purchases</th>
                <th className="py-3 px-3 text-right">Revenue ($)</th>
                <th className="py-3 px-3 text-right">Conversion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {(products || []).slice(0, 50).map((p) => (
                <tr key={p.product_id} className="hover:bg-[#131f37] transition-colors">
                  <td className="py-2 px-3 font-mono text-indigo-300">#{p.product_id}</td>
                  <td className="py-2 px-3 font-semibold text-slate-200 uppercase">{p.brand || "—"}</td>
                  <td className="py-2 px-3 font-mono text-xs text-slate-400">{p.category_code || "—"}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-300">${p.avg_price}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">{p.views?.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-cyan-400">{p.carts?.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-400">{p.purchases?.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-300">${(p.revenue / 1000).toFixed(1)}K</td>
                  <td className="py-2 px-3 text-right font-mono text-amber-300">{p.conversion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
