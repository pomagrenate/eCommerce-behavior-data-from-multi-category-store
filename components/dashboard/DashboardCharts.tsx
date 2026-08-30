"use client";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import type { DailyMetric, HourlyMetric, OverviewMetrics } from "@/lib/types";

interface Props {
  daily: DailyMetric[];
  hourly: HourlyMetric[];
  overview: OverviewMetrics;
}

export default function DashboardCharts({ daily, hourly }: Props) {
  const dailyFormatted = daily.map((d) => ({
    ...d,
    dateLabel: d.date?.toString().slice(5, 10) ?? "",
    revenueK: Math.round((d.revenue ?? 0) / 1000),
  }));

  const hourlyFormatted = hourly.map((h) => ({
    ...h,
    hourLabel: `${h.hour}:00`,
  }));

  return (
    <div className="space-y-6">
      {/* Daily trends */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Daily Events — Views, Carts, Purchases</h3>
          <LineChart
            data={dailyFormatted}
            xKey="dateLabel"
            series={[
              { key: "views",     color: "#6366f1", label: "Views" },
              { key: "carts",     color: "#06b6d4", label: "Carts" },
              { key: "purchases", color: "#10b981", label: "Purchases" },
            ]}
            yFormatter={(v) => Number(v).toLocaleString()}
          />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Daily Revenue (USD, thousands)</h3>
          <LineChart
            data={dailyFormatted}
            xKey="dateLabel"
            series={[{ key: "revenueK", color: "#10b981", label: "Revenue ($K)" }]}
            yFormatter={(v) => `$${Number(v).toLocaleString()}K`}
          />
        </div>
      </div>

      {/* Hourly pattern */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Hourly Activity Pattern (UTC)</h3>
        <p className="text-xs text-slate-500 mb-4">Average events per hour across all days in the dataset</p>
        <BarChart
          data={hourlyFormatted}
          xKey="hourLabel"
          yKey="events"
          color="#6366f1"
          height={220}
          yFormatter={(v) => Number(v).toLocaleString()}
        />
      </div>
    </div>
  );
}
