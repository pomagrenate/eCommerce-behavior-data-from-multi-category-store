"use client";
import { useState, useMemo } from "react";
import clsx from "clsx";
import SortableTable from "@/components/tables/SortableTable";
import type { CategoryMetric } from "@/lib/types";

interface Props { categories: CategoryMetric[]; topCategories: string[]; }

export default function CategoriesClient({ categories, topCategories }: Props) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() =>
    filter === "all" ? categories : categories.filter(c => c.top_category === filter),
    [categories, filter]);

  const columns = [
    { key: "category_code" as keyof CategoryMetric, label: "Category", sortable: true,
      format: (v: unknown) => <span className="font-mono text-xs text-indigo-300">{String(v)}</span> },
    { key: "views" as keyof CategoryMetric, label: "Views", sortable: true, align: "right" as const,
      format: (v: unknown) => (v as number).toLocaleString() },
    { key: "carts" as keyof CategoryMetric, label: "Carts", sortable: true, align: "right" as const,
      format: (v: unknown) => (v as number).toLocaleString() },
    { key: "purchases" as keyof CategoryMetric, label: "Purchases", sortable: true, align: "right" as const,
      format: (v: unknown) => (v as number).toLocaleString() },
    { key: "revenue" as keyof CategoryMetric, label: "Revenue", sortable: true, align: "right" as const,
      format: (v: unknown) => `$${((v as number)/1000).toFixed(1)}K` },
    { key: "conversion_rate" as keyof CategoryMetric, label: "Conv. Rate", sortable: true, align: "right" as const,
      format: (v: unknown) => {
        const val = v as number;
        return <span className={clsx("font-mono", val > 5 ? "text-emerald-400" : val > 2 ? "text-amber-400" : "text-slate-400")}>
          {val.toFixed(2)}%
        </span>;
      }},
    { key: "view_to_cart_rate" as keyof CategoryMetric, label: "View→Cart %", sortable: true, align: "right" as const,
      format: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "avg_price" as keyof CategoryMetric, label: "Avg Price", sortable: true, align: "right" as const,
      format: (v: unknown) => `$${(v as number).toFixed(0)}` },
    { key: "unique_users" as keyof CategoryMetric, label: "Users", sortable: true, align: "right" as const,
      format: (v: unknown) => (v as number).toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")}
          className={clsx("px-3 py-1 rounded-full text-xs font-medium transition-all",
            filter === "all" ? "bg-indigo-600 text-white" : "bg-[#0d1526] text-slate-400 border border-[#1e2d4a] hover:text-slate-200")}>
          All
        </button>
        {topCategories.slice(0, 12).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={clsx("px-3 py-1 rounded-full text-xs font-medium transition-all",
              filter === cat ? "bg-indigo-600 text-white" : "bg-[#0d1526] text-slate-400 border border-[#1e2d4a] hover:text-slate-200")}>
            {cat}
          </button>
        ))}
      </div>
      <div className="card">
        <p className="text-xs text-slate-500 mb-4">
          {filtered.length} subcategories · min 100 views · sorted by views descending
        </p>
        <SortableTable data={filtered} columns={columns} pageSize={20} searchable searchKeys={["category_code"]} />
      </div>
    </div>
  );
}
