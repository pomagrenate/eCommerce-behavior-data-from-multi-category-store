"use client";
import { useState, useMemo } from "react";
import clsx from "clsx";

interface Column<T> {
  key: keyof T;
  label: string;
  format?: (v: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
}

export default function SortableTable<T extends Record<string, unknown>>({
  data, columns, pageSize = 25, searchable = false, searchKeys = []
}: Props<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  const pages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  return (
    <div>
      {searchable && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full max-w-xs bg-[#0d1526] border border-[#1e2d4a] rounded-lg px-3 py-2
              text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-[#1e2d4a]">
        <table className="w-full data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={clsx("text-left", col.align === "right" && "text-right")}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-indigo-400">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={String(col.key)}
                    className={clsx(col.align === "right" && "text-right font-mono")}>
                    {col.format ? col.format(row[col.key], row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>{sorted.length.toLocaleString()} rows</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pages, 8) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={clsx(
                  "w-7 h-7 rounded text-xs transition-colors",
                  page === i ? "bg-indigo-600 text-white" : "bg-[#1e2d4a] text-slate-400 hover:bg-[#2d4a6e]"
                )}
              >
                {i + 1}
              </button>
            ))}
            {pages > 8 && <span className="px-2 py-1">…{pages}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
