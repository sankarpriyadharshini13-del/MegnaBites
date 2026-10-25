import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AdminShell from "@/components/admin/AdminShell";
import { AdminProvider } from "@/lib/admin/store";
import "./admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-admin", display: "swap" });

export const metadata: Metadata = {
  title: "Admin Console | Magna Eco Bites",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.variable}>
      <AdminProvider>
        <AdminShell>{children}</AdminShell>
      </AdminProvider>
    </div>
  );
}
