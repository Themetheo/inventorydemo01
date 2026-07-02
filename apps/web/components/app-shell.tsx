"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { get, post } from "@/lib/api";
import type { Role, SessionUser } from "@/lib/types";

const menus: Array<{ href: string; label: string; roles: Role[] }> = [
  { href: "/dashboard", label: "ภาพรวม", roles: ["owner", "manager", "stock", "staff"] },
  { href: "/inventory/request", label: "เลือกของ", roles: ["owner", "manager", "stock", "staff"] },
  { href: "/inventory/requests", label: "คำขอ", roles: ["owner", "manager", "stock", "staff"] },
  { href: "/inventory/stockroom", label: "ห้องคลัง", roles: ["owner", "manager", "stock"] },
  { href: "/inventory/movements", label: "เคลื่อนไหว", roles: ["owner", "manager", "stock"] },
  { href: "/inventory/count", label: "นับสต๊อก", roles: ["owner", "manager", "stock"] },
  { href: "/inventory/balances", label: "ยอดคงเหลือ", roles: ["owner", "manager", "stock"] },
  { href: "/settings/items", label: "ไอเทม", roles: ["owner", "manager"] },
  { href: "/settings/store-items", label: "ไอเทมสาขา", roles: ["owner", "manager"] },
  { href: "/settings/locations", label: "ตำแหน่ง", roles: ["owner", "manager"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname(); const router = useRouter(); const client = useQueryClient();
  const user = useQuery({ queryKey: ["me"], queryFn: () => get<SessionUser>("/auth/me"), retry: false });
  const logout = useMutation({ mutationFn: () => post("/auth/logout"), onSuccess: () => { client.clear(); router.replace("/login"); } });
  if (user.isLoading) return <FullState text="กำลังเปิดร้าน..." />;
  if (user.isError || !user.data) { router.replace("/login"); return <FullState text="กำลังกลับไปหน้าเข้าสู่ระบบ..." />; }
  const visible = menus.filter((menu) => menu.roles.includes(user.data.role));
  return <div className="app-market min-h-screen bg-[#fff2bd] text-[#18130f] lg:grid lg:grid-cols-[248px_1fr]">
    <aside className="hidden border-r-2 border-black bg-[#18130f] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:p-5"><Link href="/dashboard" className="mb-7 block border-2 border-white bg-red-600 p-3 shadow-[4px_4px_0_#fff2bd] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500"><span className="block font-mono text-[9px] font-black tracking-[.2em]">RESTAURANT INVENTORY</span><span className="mt-1 block text-xl font-black">STOCK MARKET</span></Link><p className="mb-2 font-mono text-[9px] font-black tracking-[.2em] text-amber-200">SELECT A ZONE</p><nav className="space-y-2">{visible.map((m, index) => <Nav key={m.href} {...m} code={String(index + 1).padStart(2, "0")} active={path.startsWith(m.href)} />)}</nav><div className="mt-auto pt-8 font-mono text-[9px] tracking-wider text-stone-400">SYSTEM READY · 8-BIT MODE</div></aside>
    <div className="min-w-0 pb-20 lg:pb-0"><header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between border-b-2 border-black bg-[#fffdf4] px-4 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center border-2 border-black bg-red-600 font-mono text-xs font-black text-white shadow-[3px_3px_0_#18130f]" aria-hidden="true">P1</span><div><p className="font-black leading-tight">{user.data.displayName || user.data.username}</p><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">{user.data.branchName} · {user.data.role}</p></div></div><button className="btn-secondary" onClick={() => logout.mutate()} disabled={logout.isPending}>ออกจากระบบ</button></header><main className="market-workspace mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main></div>
    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t-2 border-black bg-[#fffdf4] lg:hidden">{visible.map((m, index) => <Link key={m.href} href={m.href} className={`min-w-24 flex-1 border-r border-black px-2 py-2.5 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-red-600 ${path.startsWith(m.href) ? "bg-red-600 text-white" : ""}`}><span className="block font-mono text-[8px] font-black opacity-70">ZONE {String(index + 1).padStart(2, "0")}</span><span className="text-xs font-black">{m.label}</span></Link>)}</nav>
  </div>;
}
function Nav({ href, label, code, active }: { href: string; label: string; code: string; active: boolean }) { return <Link href={href} className={`market-nav block border-2 px-3 py-2.5 transition-[transform,box-shadow,background-color] duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500 ${active ? "border-white bg-white text-black shadow-[4px_4px_0_#d62b20]" : "border-stone-700 text-stone-300 hover:border-white hover:bg-stone-900 hover:text-white"}`}><span className={`mr-2 font-mono text-[9px] font-black ${active ? "text-red-700" : "text-stone-500"}`}>ZONE {code}</span><span className="text-sm font-black">{label}</span></Link>; }
export function FullState({ text }: { text: string }) { return <main className="request-market grid min-h-screen place-items-center bg-[#fff2bd]"><p className="border-2 border-black bg-white px-6 py-4 font-black shadow-[6px_6px_0_#d62b20]"><span className="mr-2 font-mono text-xs text-red-700">LOADING</span>{text}</p></main>; }
