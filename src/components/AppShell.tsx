"use client";

import {
  BarChart3,
  Calculator,
  Database,
  LayoutDashboard,
  Scale,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/responden", label: "Data Responden", icon: Users },
  { href: "/ahp", label: "Geometric Mean & AHP", icon: Scale },
  { href: "/alternatif", label: "Data Alternatif", icon: Smartphone },
  { href: "/saw", label: "Perhitungan SAW", icon: Calculator },
  { href: "/evaluasi", label: "Evaluasi & Sensitivitas", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar Desktop + Header Mobile */}
      <aside className="w-full lg:w-64 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              SPK Smartphone
            </p>
            <p className="text-xs text-slate-500">Metode AHP &amp; SAW</p>
          </div>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block mt-auto p-4 border-t border-slate-200">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              <span>Kelompok 12 · Kelas D</span>
            </div>
            <p>UPN &ldquo;Veteran&rdquo; Jawa Timur</p>
            <p className="text-slate-500">Next.js + MySQL Laragon</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
