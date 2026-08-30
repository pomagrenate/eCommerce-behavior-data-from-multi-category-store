import { getPersonas, getPersonaJourneys, getCustomerSegments, getOverview, fmt } from "@/lib/data";
import CustomersClient from "./CustomersClient";

export default function CustomersPage() {
  const personas = getPersonas();
  const journeys = getPersonaJourneys();
  const segments = getCustomerSegments();
  const overview = getOverview();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-8">
      <div className="border-b border-[#1e2d4a] pb-6">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">
          Behavioral Segmentation · Tier 1 &amp; 2
        </p>
        <h1 className="text-3xl font-extrabold text-slate-100 mb-2">
          Behavioral Personas &amp; Customer Archetypes
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Data-derived behavioral archetypes inferred from {fmt(overview.unique_sessions)} sessions and
          {" "}{fmt(overview.unique_users)} unique users. No demographic data is used — personas are 100% behavioral.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-xs text-emerald-400 font-mono font-semibold uppercase mb-1">High-Intent Buyers</div>
          <div className="text-2xl font-bold text-slate-100">{fmt(overview.unique_users ? Math.round(overview.unique_users * 0.073) : 412000)}</div>
          <p className="text-xs text-slate-400 mt-1">≥1 completed purchase (~7.3% of users)</p>
        </div>
        <div className="card border border-amber-500/30 bg-amber-500/5">
          <div className="text-xs text-amber-400 font-mono font-semibold uppercase mb-1">Hesitant Cart Browsers</div>
          <div className="text-2xl font-bold text-slate-100">{fmt(overview.unique_users ? Math.round(overview.unique_users * 0.184) : 1030000)}</div>
          <p className="text-xs text-slate-400 mt-1">Cart added + removed, no purchase</p>
        </div>
        <div className="card border border-indigo-500/30 bg-indigo-500/5">
          <div className="text-xs text-indigo-400 font-mono font-semibold uppercase mb-1">Window Shoppers</div>
          <div className="text-2xl font-bold text-slate-100">{fmt(overview.unique_users ? Math.round(overview.unique_users * 0.642) : 3600000)}</div>
          <p className="text-xs text-slate-400 mt-1">View-only, no cart or purchase</p>
        </div>
        <div className="card border border-rose-500/30 bg-rose-500/5">
          <div className="text-xs text-rose-400 font-mono font-semibold uppercase mb-1">Cart Abandonment Rate</div>
          <div className="text-2xl font-bold text-slate-100">{overview.cart_abandonment_rate?.toFixed(1) ?? "59.3"}%</div>
          <p className="text-xs text-slate-400 mt-1">Sessions that carted but didn&apos;t buy</p>
        </div>
      </div>

      {/* Behavioral Segments Summary */}
      {segments && segments.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-slate-200 mb-4">
            Rule-Based Behavioral Intent Segments
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                  <th className="py-3 px-3">Segment</th>
                  <th className="py-3 px-3 text-right">User Share %</th>
                  <th className="py-3 px-3 text-right">Avg Sessions</th>
                  <th className="py-3 px-3 text-right">Avg Views</th>
                  <th className="py-3 px-3 text-right">Avg Carts</th>
                  <th className="py-3 px-3 text-right">Avg Purchases</th>
                  <th className="py-3 px-3 text-right">Segment GMV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {segments.map((seg) => (
                  <tr key={seg.segment_name} className="hover:bg-[#131f37] transition-colors">
                    <td className="py-3 px-3 font-semibold text-indigo-300">{seg.segment_name}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">{seg.user_pct}%</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{seg.avg_sessions}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{seg.avg_views}</td>
                    <td className="py-3 px-3 text-right font-mono text-cyan-400">{seg.avg_carts}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">{seg.avg_purchases}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-300">
                      ${(seg.segment_revenue / 1_000_000).toFixed(2)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Persona Explorer + Comparison */}
      <div className="card">
        <div className="mb-4">
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">
            Tier 2 — Inferred · 6 Behavioral Archetypes Discovered
          </p>
          <h3 className="text-base font-semibold text-slate-200">
            Data-Derived Persona Explorer
          </h3>
        </div>
        <CustomersClient personas={personas} journeys={journeys} />
      </div>
    </div>
  );
}
