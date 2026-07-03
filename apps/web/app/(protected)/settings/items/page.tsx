"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemImage } from "@/components/item-image";
import { Empty, ErrorBox, PageHeader } from "@/components/page-kit";
import { get } from "@/lib/api";
import { filterValidItems } from "@/lib/items";
import type { Category, Item, SessionUser } from "@/lib/types";

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [success, setSuccess] = useState("");
  const items = useQuery({ queryKey: ["items"], queryFn: () => get<Item[]>("/items") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
  const me = useQuery({ queryKey: ["me"], queryFn: () => get<SessionUser>("/auth/me"), retry: false });
  const canEdit = me.data?.role === "owner" || me.data?.role === "manager";

  useEffect(() => {
    const message = sessionStorage.getItem("item-config-success");
    if (message) { setSuccess(message); sessionStorage.removeItem("item-config-success"); }
  }, []);

  const validItems = useMemo(() => filterValidItems(items.data ?? []), [items.data]);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return validItems.filter((item) => item.itemName.toLowerCase().includes(keyword) && (!category || item.categoryId === category) && (activeFilter === "all" || (activeFilter === "active" ? item.isActive : !item.isActive)));
  }, [validItems, search, category, activeFilter]);
  const hasFilters = search.trim() !== "" || category !== "" || activeFilter !== "all";

  return <>
    <PageHeader eyebrow="Item Catalog · Master Data" title="ตั้งค่าไอเทม" description={`จัดการชื่อ หมวดหมู่ หน่วย และรูปสินค้าของร้าน · ${validItems.length} รายการ`} actions={canEdit ? <Link href="/settings/items/new" className="btn-primary inline-flex items-center">+ เพิ่มไอเทม</Link> : undefined} />
    <div className="mb-5 flex flex-col gap-3 border-b-2 border-black pb-5 lg:flex-row lg:items-end">
      <label className="min-w-0 flex-1 text-xs font-black">ค้นหาจากชื่อสินค้า<input className="field mt-1" placeholder="เช่น หมูแดง" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label className="text-xs font-black lg:w-56">หมวดหมู่<select className="field mt-1" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">ทุกหมวดหมู่</option>{categories.data?.filter((value) => value.categoryId && value.categoryName).map((value, index) => <option key={`category-${value.categoryId}-${index}`} value={value.categoryId}>{value.categoryName}</option>)}</select></label>
      <label className="text-xs font-black lg:w-52">สถานะ<select className="field mt-1" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}><option value="all">ทั้งหมด</option><option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option></select></label>
    </div>
    <div className="mb-6 flex flex-col gap-3 border-2 border-black bg-amber-100 p-4 shadow-[4px_4px_0_#18130f] sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[10px] font-black tracking-[.18em] text-red-700">ITEM MASTER</p><p className="mt-1 text-sm font-bold">ข้อมูลกลาง เช่น ชื่อ รูป หน่วย และหมวดหมู่</p></div><Link href="/settings/store-items" className="btn-secondary inline-flex items-center justify-center">ไปตั้งค่าไอเทมสาขา →</Link></div>
    {success && <div role="status" className="mb-5 border-2 border-black bg-white p-4 shadow-[5px_5px_0_#18130f]"><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">SAVE COMPLETE</p><p className="mt-1 font-black">{success}</p></div>}
    {items.isLoading ? <ItemsSkeleton /> : items.isError ? <ErrorBox error={items.error} retry={() => items.refetch()} /> : !validItems.length ? <div className="border-2 border-dashed border-black bg-white p-10 text-center"><Empty text="ยังไม่มีไอเทม" />{canEdit && <Link href="/settings/items/new" className="btn-primary mt-5 inline-flex items-center">เพิ่มไอเทมแรก</Link>}</div> : !filtered.length ? <Empty text={hasFilters ? "ไม่พบไอเทมที่ค้นหา" : "ยังไม่มีไอเทม"} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((item) => <article key={item.itemId} className="overflow-hidden border-2 border-black bg-white"><div className="grid grid-cols-[112px_minmax(0,1fr)]"><ItemImage src={item.imageUrl} itemName={item.itemName} className="h-full w-full border-r-2 border-black" /><div className="min-w-0 p-4"><p className="font-mono text-[9px] font-black tracking-wider text-red-700">{item.itemId}</p><h2 className="mt-1 truncate text-lg font-black">{item.itemName}</h2><p className="mt-1 text-sm font-bold text-stone-500">{categories.data?.find((value) => value.categoryId === item.categoryId)?.categoryName || item.categoryId} · {item.unit}</p><span className={`mt-3 inline-flex border-2 border-black px-2 py-1 font-mono text-[9px] font-black ${item.isActive ? "bg-black text-white" : "bg-red-600 text-white"}`}>{item.isActive ? "ACTIVE" : "INACTIVE"}</span></div></div>{canEdit && <Link className="flex min-h-11 items-center border-t-2 border-black bg-amber-100 px-4 font-black hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-red-600" href={`/settings/items/${encodeURIComponent(item.itemId)}/edit`}>แก้ไขไอเทม →</Link>}</article>)}
    </div>}
  </>;
}

function ItemsSkeleton() {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="กำลังโหลดไอเทม">{Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse border-2 border-black bg-white p-4 shadow-[4px_4px_0_#18130f]"><div className="h-24 bg-amber-100"/><div className="mt-4 h-5 w-2/3 bg-stone-200"/><div className="mt-2 h-4 w-1/2 bg-stone-200"/></div>)}</div>;
}
