"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ErrorBox, PageHeader } from "@/components/page-kit";
import { get } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => get<DashboardSummary>("/dashboard") });
  return <AppShell><PageHeader eyebrow="Market Control · Today" title="ภาพรวมตลาดวันนี้" description="ดูคิวงาน สินค้าใกล้หมด และเริ่มงานหลักจากจุดเดียว" />
    {query.isError ? <ErrorBox error={query.error} retry={() => query.refetch()} /> : <section aria-label="สถานะวันนี้" className="grid gap-4 sm:grid-cols-3">{[["QUEUE 01", "คำขอรอดำเนินการ", query.data?.pendingRequests], ["ALERT 02", "ไอเทมต่ำกว่าขั้นต่ำ", query.data?.lowStockItems], ["TASK 03", "รายการที่ต้องนับ", query.data?.dailyCountItems]].map(([code, label, value], index) => <div key={String(label)} className={`panel p-5 ${index === 1 ? "shadow-[6px_6px_0_#d62b20]" : ""}`}><p className="font-mono text-[10px] font-black tracking-[.18em] text-red-700">{code}</p><p className="mt-2 text-sm font-black text-stone-600">{label}</p><p className="mt-3 text-5xl font-black leading-none">{query.isLoading ? "–" : value}</p></div>)}</section>}
    <section className="mt-9"><div className="mb-4"><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">QUICK TRAVEL</p><h2 className="text-xl font-black">ไปยังโซนงาน</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["STALL 01", "เลือกของ", "/inventory/request"], ["DOCK 02", "รับของเข้า", "/inventory/movements"], ["CHECK 03", "นับสต๊อก", "/inventory/count"], ["QUEUE 04", "ดูคำขอ", "/inventory/stockroom"]].map(([code, label, href]) => <Link className="group border-2 border-black bg-[#fffdf4] p-5 shadow-[4px_4px_0_#18130f] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-y-1 hover:bg-red-600 hover:text-white hover:shadow-[6px_6px_0_#18130f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600" key={href} href={href}><span className="block font-mono text-[9px] font-black tracking-[.18em] text-red-700 group-hover:text-red-100">{code}</span><span className="mt-2 flex items-center justify-between font-black"><span>{label}</span><span aria-hidden="true">→</span></span></Link>)}</div></section>
  </AppShell>;
}
