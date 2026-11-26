import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPK Pemilihan Smartphone Mahasiswa (AHP & SAW)",
  description:
    "Sistem Pendukung Keputusan Pemilihan Smartphone Bagi Mahasiswa Menggunakan Metode Analytical Hierarchy Process (AHP) dan Simple Additive Weighting (SAW).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
