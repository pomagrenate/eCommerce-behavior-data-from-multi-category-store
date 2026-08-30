"use client";
import { useState, useMemo } from "react";
import clsx from "clsx";
import SortableTable from "@/components/tables/SortableTable";
import ScatterPlot from "@/components/charts/ScatterPlot";
import type { BrandMetric, BrandJourneyMetricsData } from "@/lib/types";

interface Props {
  brands: BrandMetric[];
  brandJourney?: BrandJourneyMetricsData;
}

type SortMode = "views" | "revenue" | "conversion" | "cart_to_purchase";

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "views",           label: "Traffic" },
  { key: "revenue",         label: "Revenue" },
  { key: "conversion",      label: "Overall Conversion" },
  { key: "cart_to_purchase",label: "Cart → Purchase" },
];

export default function BrandsClient({ brands, brandJourney }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("views");
  const [view, setView] = useState<"table" | "scatter" | "journey">("table");

  const sorted = useMemo(() => {
    const keyMap: Record<SortMode, keyof BrandMetric> = {
      views: "views",
      revenue: "revenue",
      conversion: "overall_conversion_rate",
      cart_to_purchase: "cart_to_purchase_rate",
    };
    return [...brands].sort((a, b) => (b[keyMap[sortMode]] as number) - (a[keyMap[sortMode]] as number));
  }, [brands, sortMode]);

  // Median values for quadrant lines
  const medViews = useMemo(() => {
    const v = brands.map(b => b.views).sort((a,b) => a-b);
    return v[Math.floor(v.length/2)] ?? 0;
  }, [brands]);
  const medConv = useMemo(() => {
    const v = brands.map(b => b.overall_conversion_rate).sort((a,b) => a-b);
    return v[Math.floor(v.length/2)] ?? 0;
  }, [brands]);

  const scatterData = useMemo(() =>
    brands.slice(0, 150).map(b => ({
      x: b.views,
      y: b.overall_conversion_rate,
      z: b.revenue / 1000,
      label: b.brand,
    })), [brands]);

  const columns = [
    { key: "brand" as keyof BrandMetric, label: "Brand", sortable: true,
      format: (v: unknown) => <span className="font-medium text-slate-200 uppercase">{String(v)}</span> },
    { key: "views" as keyof BrandMetric, label: "Views", sortable: true, align: "right" as const,
      format: (v: unknown) => (v as number).toLocaleString() },
    { key: "carts" as keyof BrandMetric, label: "Carts", sortable: true, align: "right" as const,
      format: (v: unknown) => (v as number).toLocaleString() },
    { key: "purchases" as keyof BrandMetric, label: "Purchases", sortable: true, align: "right" as const,
      format: (v: unknown) => (v as number).toLocaleString() },
    { key: "revenue" as keyof BrandMetric, label: "Revenue", sortable: true, align: "right" as const,
      format: (v: unknown) => `$${((v as number)/1000).toFixed(1)}K` },
    { key: "view_to_cart_rate" as keyof BrandMetric, label: "View→Cart %", sortable: true, align: "right" as const,
      format: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "cart_to_purchase_rate" as keyof BrandMetric, label: "Cart→Purchase %", sortable: true, align: "right" as const,
      format: (v: unknown) => {
        const val = v as number;
        return (
          <span className={clsx("font-mono", val > 50 ? "text-emerald-400" : val > 20 ? "text-amber-400" : "text-rose-400")}>
            {val.toFixed(2)}%
          </span>
        );
      }},
    { key: "overall_conversion_rate" as keyof BrandMetric, label: "Overall Conv. %", sortable: true, align: "right" as const,
      format: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "avg_purchase_price" as keyof BrandMetric, label: "Avg Price", sortable: true, align: "right" as const,
      format: (v: unknown) => `$${(v as number ?? 0).toFixed(0)}` },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {view !== "journey" && (
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.key} onClick={() => setSortMode(opt.key)}
                className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  sortMode === opt.key ? "bg-indigo-600 text-white" : "bg-[#0d1526] text-slate-400 border border-[#1e2d4a] hover:text-slate-200")}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          {[
            { id: "table", label: "Table" },
            { id: "scatter", label: "Scatter Plot" },
            { id: "journey", label: "Purchase Journey Comparison" }
          ].map((v) => (
            <button key={v.id} onClick={() => setView(v.id as any)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                view === v.id ? "bg-indigo-600 text-white" : "bg-[#0d1526] text-slate-400 border border-[#1e2d4a] hover:text-slate-200")}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <div className="card">
          <p className="text-xs text-slate-500 mb-4">
            Sorted by: <strong className="text-slate-300">{SORT_OPTIONS.find(o=>o.key===sortMode)?.label}</strong>
            {" · "}{brands.length} brands (min 1,000 views)
          </p>
          <SortableTable
            data={sorted}
            columns={columns}
            pageSize={20}
            searchable
            searchKeys={["brand"]}
          />
        </div>
      ) : view === "scatter" ? (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Traffic vs. Conversion Rate — Brand Quadrant</h3>
          <p className="text-xs text-slate-500 mb-4">
            Each point = 1 brand. Dashed lines = median. Bubble size ∝ revenue.
          </p>
          <ScatterPlot
            data={scatterData}
            xLabel="Views"
            yLabel="Conversion Rate (%)"
            xFormatter={(v) => `${(v/1000).toFixed(0)}K`}
            yFormatter={(v) => `${v.toFixed(2)}%`}
            height={400}
            referenceX={medViews}
            referenceY={medConv}
          />
        </div>
      ) : (
        <div className="card space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Market Research: Electronics Purchase Journey Comparison</h3>
            <p className="text-xs text-slate-400">
              Comparative funnel behavior and decision speed for major brands (**Apple**, **Samsung**, **Xiaomi**, **Huawei**, **Lenovo**...).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d4a] text-slate-400 text-left">
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3 text-right">Total Sessions</th>
                  <th className="py-3 px-3 text-right">View → Cart %</th>
                  <th className="py-3 px-3 text-right">Cart → Purchase %</th>
                  <th className="py-3 px-3 text-right">Cart Abandonment %</th>
                  <th className="py-3 px-3 text-right">Overall Conv %</th>
                  <th className="py-3 px-3 text-right">Avg Views / Session</th>
                  <th className="py-3 px-3 text-right">Avg Views Before Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {(brandJourney?.brand_journeys || []).map((bj) => (
                  <tr key={bj.brand} className="hover:bg-[#131f37] transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200 uppercase">{bj.brand}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{bj.total_sessions?.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-cyan-400">{bj.view_to_cart_pct}%</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">{bj.cart_to_purchase_pct}%</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">{bj.cart_abandonment_pct}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300">{bj.overall_conversion_pct}%</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{bj.avg_views_per_session}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-300">{bj.avg_views_before_purchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

