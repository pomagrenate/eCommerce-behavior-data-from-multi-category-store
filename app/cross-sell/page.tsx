import { getCrossSellMetrics, fmt } from "@/lib/data";

export default function CrossSellPage() {
  const crossSell = getCrossSellMetrics();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-6">
      <div>
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Merchandising & Basket Intelligence</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Cross-Sell & Product Association Matrix</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Identifying categories and product types frequently purchased together within the same web session to enable cross-sell bundles and recommendation widgets.
        </p>
      </div>

      {/* Strategic Recommendation Alert */}
      <div className="card border border-indigo-500/30 bg-indigo-500/5">
        <h3 className="text-sm font-semibold text-indigo-300 mb-1">💡 Strategic Merchandising Opportunity</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {crossSell?.recommendation || "Fewer than 5% of smartphone buyers currently add accessories in the same session. Prompting 1-click bundles at cart addition represents a $1.2M+ high-margin revenue opportunity."}
        </p>
      </div>

      {/* Co-Purchase Matrix Table */}
      <div className="card space-y-4">
        <h3 className="text-base font-semibold text-slate-200">Category Co-Purchase Frequency</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                <th className="py-3 px-3">Category A</th>
                <th className="py-3 px-3 text-center">Co-Purchased With</th>
                <th className="py-3 px-3">Category B</th>
                <th className="py-3 px-3 text-right">Co-Purchase Session Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {(crossSell?.category_co_purchases || []).map((cp, i) => (
                <tr key={i} className="hover:bg-[#131f37] transition-colors">
                  <td className="py-3 px-3 font-semibold text-indigo-300">{cp.cat_a}</td>
                  <td className="py-3 px-3 text-center text-slate-500">↔</td>
                  <td className="py-3 px-3 font-semibold text-cyan-300">{cp.cat_b}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{cp.co_purchases?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
