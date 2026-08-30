import { getNextDataStrategyMetrics } from "@/lib/data";

export default function MethodologyPage() {
  const nextStrategy = getNextDataStrategyMetrics();

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      <div className="mb-6">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">System & Governance</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Methodology, Data Limitations & Next Data Strategy</h1>
        <p className="text-slate-400 text-sm">
          Technical specifications, dataset boundaries, explicit data limitations, and the next-generation data acquisition roadmap.
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        {/* Processing Architecture */}
        <section className="card space-y-3">
          <h2 className="text-base font-semibold text-slate-100">Processing Architecture & Offline Pipeline</h2>
          <div className="font-mono text-xs text-indigo-300 bg-[#0d1526] rounded-xl p-4 border border-[#1e2d4a] leading-relaxed">
            RAW CSVs (~13.7 GB) <br />
            &nbsp;&nbsp;↓ DuckDB Engine CLI (main.py) <br />
            In-Memory Relational Views & Single-Pass SQL <br />
            &nbsp;&nbsp;↓ Compact Aggregations <br />
            22 Analytical JSON Outputs (&lt;500 KB total) <br />
            &nbsp;&nbsp;↓ Next.js Vercel Production Runtime (Sub-millisecond sub-assembly)
          </div>
          <p className="text-slate-400 text-xs">
            Heavy computation runs <strong className="text-slate-200">offline</strong> via <code className="font-mono text-indigo-300">analytics/main.py</code> using DuckDB disk-spilling and configurable memory limits (`--memory-limit 2GB`).
          </p>
        </section>

        {/* Data Limitations */}
        <section className="card space-y-3 border border-amber-500/20 bg-amber-500/5">
          <h2 className="text-base font-semibold text-amber-300">What This Dataset Cannot Tell Us (Data Limitations)</h2>
          <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
            <li><strong className="text-white">Observation Window Limit</strong>: Dataset covers only 2 calendar months (Oct–Nov 2019). Long-term customer lifetime value (LTV) cannot be calculated.</li>
            <li><strong className="text-white">Missing Order Groupings</strong>: No `order_id` field. Multiple product purchases within a session are evaluated as discrete item purchase events.</li>
            <li><strong className="text-white">No Financial Margins / COGS</strong>: Revenue represents Gross Merchandise Value (GMV) proxy. Net profitability and COGS are unobserved.</li>
            <li><strong className="text-white">No Marketing Attribution</strong>: No UTM campaign tags, referral sources, or Ad spend data. Customer Acquisition Cost (CAC) cannot be calculated.</li>
            <li><strong className="text-white">No Demographics or Geography</strong>: User segmentation is strictly behavioral based on clickstream activity.</li>
          </ul>
        </section>

        {/* Next Data Acquisition Strategy */}
        <section className="card space-y-4">
          <h2 className="text-base font-semibold text-slate-100">Next Data Acquisition Roadmap (Event Schema V2)</h2>
          <p className="text-xs text-slate-400">
            Recommended schema upgrades for the data engineering team to unlock profitability modeling and marketing attribution.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs data-table">
              <thead>
                <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                  <th className="py-2.5 px-3">Field to Collect</th>
                  <th className="py-2.5 px-3">Business Question Enabled</th>
                  <th className="py-2.5 px-3">Decision Enabled</th>
                  <th className="py-2.5 px-3 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {(nextStrategy || []).map((ns, i) => (
                  <tr key={i} className="hover:bg-[#131f37] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-300">{ns.field}</td>
                    <td className="py-2.5 px-3 text-slate-300">{ns.business_question}</td>
                    <td className="py-2.5 px-3 text-slate-400">{ns.decision_enabled}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">{ns.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

