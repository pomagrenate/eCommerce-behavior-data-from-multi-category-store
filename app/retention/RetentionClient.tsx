"use client";
import clsx from "clsx";
import type { RetentionMetrics } from "@/lib/types";

interface Props { retention: RetentionMetrics; }

export default function RetentionClient({ retention }: Props) {
  // Build cohort table
  const cohortMap: Record<string, Record<string, { active: number; purchasing: number }>> = {};
  for (const row of retention.cohort_data ?? []) {
    if (!cohortMap[row.cohort_month]) cohortMap[row.cohort_month] = {};
    cohortMap[row.cohort_month][row.active_month] = {
      active: row.active_users,
      purchasing: row.purchasing_users,
    };
  }
  const cohortMonths = Object.keys(cohortMap).sort();
  const allMonths = Array.from(new Set((retention.cohort_data ?? []).map(r => r.active_month))).sort();


  const repeatDist = retention.repeat_purchase_distribution ?? [];
  const maxUsers = Math.max(...repeatDist.map(r => r.users), 1);

  return (
    <div className="space-y-6">
      {/* Cohort table */}
      {cohortMonths.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Cross-Month Activity</h3>
          <p className="text-xs text-slate-500 mb-4">
            Rows = cohort (first-seen month). Columns = active month. Cell = unique users active.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cohort</th>
                {allMonths.map(m => <th key={m} className="text-right">{m.slice(0,7)}</th>)}
              </tr>
            </thead>
            <tbody>
              {cohortMonths.map(cohort => {
                const baseUsers = cohortMap[cohort][cohort]?.active ?? 1;
                return (
                  <tr key={cohort}>
                    <td className="font-medium text-slate-200">{cohort.slice(0,7)}</td>
                    {allMonths.map(month => {
                      const cell = cohortMap[cohort]?.[month];
                      if (!cell) return <td key={month} className="text-right text-slate-700">—</td>;
                      const retPct = (cell.active / baseUsers) * 100;
                      const isBase = month === cohort;
                      return (
                        <td key={month} className="text-right">
                          <div className={clsx("inline-block px-2 py-1 rounded text-xs font-mono",
                            isBase ? "bg-indigo-600/30 text-indigo-300" :
                            retPct > 50 ? "bg-emerald-600/20 text-emerald-300" :
                            retPct > 20 ? "bg-amber-600/20 text-amber-300" : "bg-slate-700/30 text-slate-400")}>
                            {cell.active.toLocaleString()}
                            {!isBase && <span className="ml-1 text-[10px] opacity-70">{retPct.toFixed(0)}%</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Repeat purchase distribution */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Repeat Purchase Distribution</h3>
        <p className="text-xs text-slate-500 mb-4">
          How many users made 1, 2, 3+ purchases within the 2-month window
        </p>
        <div className="space-y-2">
          {repeatDist.slice(0, 15).map((r) => {
            const barW = (r.users / maxUsers) * 100;
            return (
              <div key={r.purchase_count} className="flex items-center gap-3">
                <div className="w-24 text-right text-sm text-slate-400">
                  {r.purchase_count === 1 ? "1 purchase" : `${r.purchase_count} purchases`}
                </div>
                <div className="flex-1 bg-[#0d1526] rounded h-6 flex items-center">
                  <div className="h-6 rounded bg-indigo-600/70" style={{ width: `${barW}%` }} />
                </div>
                <div className="w-28 text-xs text-slate-400 text-right font-mono">
                  {r.users.toLocaleString()} <span className="text-slate-600">({r.pct.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-[#0d1526] rounded-lg text-xs text-slate-500">
          <strong className="text-slate-400">Note:</strong> This dataset covers Oct–Nov 2019 only.
          Users with high purchase counts within this window may be power users or bulk buyers,
          not necessarily returning customers in the traditional retention sense.
        </div>
      </div>
    </div>
  );
}
