"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  SlidersHorizontal,
  Zap,
  FlaskConical,
  Filter,
  GitCommitHorizontal,
  Users,
  Tag,
  Award,
  Grid,
  Package,
  Link2,
  BookOpen
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Executive",
    items: [
      { href: "/",             label: "CEO Dashboard", icon: LayoutDashboard },
      { href: "/simulator",    label: "CEO Simulator", icon: SlidersHorizontal },
      { href: "/opportunities",label: "Opportunities", icon: Zap },
      { href: "/experiments",  label: "Experiments",   icon: FlaskConical },
    ]
  },
  {
    title: "Behavior & Funnel",
    items: [
      { href: "/funnel",       label: "Funnel & Leakage", icon: Filter },
      { href: "/journey",      label: "Customer Journey", icon: GitCommitHorizontal },
      { href: "/customers",    label: "User Segments",    icon: Users },
      { href: "/pricing",      label: "Price Sensitivity",icon: Tag },
    ]
  },
  {
    title: "Merchandising",
    items: [
      { href: "/brands",       label: "Brand Intelligence",icon: Award },
      { href: "/categories",   label: "Categories",       icon: Grid },
      { href: "/products",     label: "Products & Pareto", icon: Package },
      { href: "/cross-sell",   label: "Cross-Sell Matrix",icon: Link2 },
    ]
  },
  {
    title: "System",
    items: [
      { href: "/methodology",  label: "Methodology & Limits", icon: BookOpen },
    ]
  }
];

export default function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[230px] min-h-screen flex-shrink-0 border-r border-[#1e2d4a] bg-[#0d1526] flex flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#1e2d4a]">
        <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-1">Behavior Intelligence</div>
        <h1 className="text-sm font-bold text-slate-100 leading-tight">
          E-Commerce<br />
          <span className="gradient-text font-black text-indigo-400">Discovery Engine</span>
        </h1>
        <div className="mt-1 text-[10px] font-mono text-slate-500">110M+ events · Oct–Nov 2019</div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150",
                      active
                        ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-600/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1e2d4a] bg-[#080d18]">
        <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
          DuckDB Engine · Next.js · Vercel
        </div>
      </div>
    </aside>
  );
}

