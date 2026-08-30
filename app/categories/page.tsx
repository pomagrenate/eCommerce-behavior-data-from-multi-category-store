import { getCategoryMetrics } from "@/lib/data";
import CategoriesClient from "./CategoriesClient";

export default function CategoriesPage() {
  const categories = getCategoryMetrics();
  const topCategories = Array.from(new Set(categories.map(c => c.top_category))).sort();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl">
      <div className="mb-8">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Category Analysis</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Product Categories</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Conversion rates, revenue, and abandonment by product category. Filter by top-level category.
        </p>
      </div>
      <CategoriesClient categories={categories} topCategories={topCategories} />
    </div>
  );
}
