import { getOverview, getDailyMetrics, getHourlyMetrics, getCeoFindings, fmt, fmtPct, fmtRevenue } from "@/lib/data";
import KPICard from "@/components/dashboard/KPICard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import Link from "next/link";
import { Zap, FlaskConical } from "lucide-react";

export default function DashboardPage() {
  const ov = getOverview();
  const daily = getDailyMetrics();
  const hourly = getHourlyMetrics();
  const findings = getCeoFindings();

  const avgDailyPurchases = ov.total_purchases / (daily.length || 1);

  return (
    <div className="p-6 md:p-8 max-w-screen-xl space-y-8">
      {/* Executive Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2d4a] pb-6">
        <div>
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Executive Decision Support Platform</p>
          <h1 className="text-3xl font-extrabold text-slate-100">
            E-Commerce CEO <span className="gradient-text text-indigo-400">Executive Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Commercial behavior intelligence derived from <strong className="text-slate-200">{fmt(ov.total_events)}</strong> event records (~13.7 GB raw dataset).
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/opportunities" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-300" /> Executive Opportunities
          </Link>
          <Link href="/experiments" className="px-4 py-2 bg-[#131f37] hover:bg-[#1c2d4f] text-slate-200 font-semibold border border-[#1e2d4a] rounded-lg text-xs transition-all flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" /> Experiment Roadmap
          </Link>
        </div>
      </div>

      {/* Business Snapshot KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Event Volume"  value={fmt(ov.total_events)}    sub="Oct 1 – Nov 30, 2019" accent="indigo" />
        <KPICard label="Unique Active Users" value={fmt(ov.unique_users)}    sub="distinct user IDs"    accent="cyan" />
        <KPICard label="Unique Web Sessions" value={fmt(ov.unique_sessions)} sub="user sessions"        accent="blue" />
        <KPICard label="Observed Revenue"    value={fmtRevenue(ov.total_revenue)} sub="from completed purchases" accent="emerald" />
        <KPICard label="Total Views"         value={fmt(ov.total_views)}     sub="product detail views" accent="violet" />
        <KPICard label="Total Purchases"     value={fmt(ov.total_purchases)} sub={`avg ${fmt(avgDailyPurchases, 0)}/day`} accent="amber" />
        <KPICard label="Event Conversion Rate" value={fmtPct(ov.event_conversion_rate)} sub="views → purchases" accent="cyan" />
        <KPICard label="Cart Abandonment"    value={fmtPct(ov.cart_abandonment_rate)} sub="#1 business leakage point" accent="rose" />
      </div>

      {/* Top 10 Executive Findings Section */}
      <div className="card space-y-6 border border-indigo-500/30 bg-[#0c1322]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-bold">Master CEO Discovery</span>
            <span className="badge border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] uppercase font-mono">10 Core Findings</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            “If I were CEO, what are the 10 most important things I must know, and what will I do?”
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized strategic findings translating behavioral evidence into concrete actions, expected revenue impact, and validation experiments.
          </p>
        </div>

        <div className="space-y-4">
          {(findings || []).map((f) => (
            <div key={f.rank} className="p-4 rounded-xl bg-[#080d18] border border-[#1e2d4a] hover:border-indigo-500/40 transition-all space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2d4a] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                    #{f.rank}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{f.finding}</h3>
                </div>
                <span className="badge border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold">
                  Impact: {f.expected_impact}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-mono font-semibold block mb-0.5">Empirical Evidence:</span>
                  <p className="text-slate-300">{f.evidence}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono font-semibold block mb-0.5">Business Meaning:</span>
                  <p className="text-slate-300">{f.meaning}</p>
                </div>
              </div>

              <div className="bg-[#101a2e] p-3 rounded-lg border border-[#1e2d4a]/60 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-indigo-400 font-semibold font-mono">Recommended CEO Action: </span>
                  <span className="text-slate-200">{f.action}</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  Validation: <span className="text-amber-300">{f.validation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <DashboardCharts daily={daily} hourly={hourly} overview={ov} />
    </div>
  );
}

