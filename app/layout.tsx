import type { Metadata } from "next";
import "./globals.css";
import NavSidebar from "@/components/NavSidebar";

export const metadata: Metadata = {
  title: "E-Commerce Behavior Intelligence — 110M+ Events",
  description:
    "A large-scale e-commerce behavioral analytics case study analyzing 110M+ events across views, carts, removals, and purchases to uncover funnel friction, customer journey patterns, and conversion opportunities.",
  openGraph: {
    title: "E-Commerce Behavior Intelligence",
    description: "110M+ Events. 2 Months. One Behavioral Funnel.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen bg-[#060b14] text-slate-200">
        <NavSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
