"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemImage } from "@/components/item-image";
import { ErrorBox, PageHeader } from "@/components/page-kit";
import { get, put } from "@/lib/api";
import type { Category, Item, Location, SessionUser, StoreItem } from "@/lib/types";

export default function StoreItemsPage() {
  const client = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => get<SessionUser>("/auth/me") });
  const items = useQuery({ queryKey: ["items"], queryFn: () => get<Item[]>("/items") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
  const locations = useQuery({ queryKey: ["locations"], queryFn: () => get<Location[]>("/locations") });
  const store = useQuery({ queryKey: ["store-items"], queryFn: () => get<StoreItem[]>("/store-items") });
  const [draft, setDraft] = useState<Record<string, StoreItem>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);

  useEffect(() => { if (store.data) setDraft(Object.fromEntries(store.data.map((value) => [value.itemId, value]))); }, [store.data]);
  const update = (itemId: string, patch: Partial<StoreItem>) => setDraft((current) => {
    const base: StoreItem = { storeItemId: "", branchId: me.data?.branchId ?? "", itemId, minQty: 0, targetQty: 0, defaultLocationId: "", allowRequest: true, requireDailyCount: false, isActive: true };
    return { ...current, [itemId]: { ...base, ...(current[itemId] ?? {}), ...patch } };
  });
  const save = useMutation({ mutationFn: () => put("/store-items/batch", { branchId: me.data?.branchId, items: Object.values(draft) }), onSuccess: () => client.invalidateQueries({ queryKey: ["store-items"] }) });
  const filtered = useMemo(() => (items.data ?? []).filter((value) => value.itemName.toLowerCase().includes(search.toLowerCase()) && (!category || value.categoryId === category) && (!selectedOnly || draft[value.itemId]?.isActive)), [items.data, search, category, selectedOnly, draft]);

  return <>
    <PageHeader eyebrow="Branch Loadout · Store Items" title="ไอเทมสาขา" description="กำหนดว่าสาขาใช้สินค้าใด ขั้นต่ำเท่าไร และเก็บที่ไหน" actions={<button className="btn-primary" disabled={save.isPending || !me.data} onClick={() => save.mutate()}>{save.isPending ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</button>} />
    <div className="mb-6 flex flex-col gap-3 border-2 border-black bg-amber-100 p-4 shadow-[4px_4px_0_#18130f] sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-mono text-[10px] font-black tracking-[.18em] text-red-700">BRANCH CONFIG</p><p className="mt-1 text-sm font-bold">ค่าขั้นต่ำ เป้าหมาย ตำแหน่ง และสิทธิ์การเบิกของสาขา</p></div>
      <Link href="/settings/items" className="btn-secondary inline-flex items-center justify-center">← ไปข้อมูลกลางไอเทม</Link>
    </div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <input className="field" placeholder="ค้นหาสินค้า" value={search} onChange={(event) => setSearch(event.target.value)} />
      <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">ทุกหมวด</option>{categories.data?.map((value, index) => <option key={`category-${value.categoryId || "empty"}-${index}`} value={value.categoryId}>{value.categoryName}</option>)}</select>
      <label className="flex min-h-11 items-center gap-2 border-2 border-black bg-white px-3 font-bold"><input type="checkbox" checked={selectedOnly} onChange={(event) => setSelectedOnly(event.target.checked)} /> เฉพาะที่สาขาใช้</label>
    </div>
    {save.error && <div className="mb-5"><ErrorBox error={save.error} /></div>}
    <div className="grid gap-4 md:grid-cols-2">{filtered.map((item, itemIndex) => {
      const value = draft[item.itemId];
      return <article className={`border-2 bg-white ${value?.isActive ? "border-black shadow-[4px_4px_0_#18130f]" : "border-stone-400 opacity-75"}`} key={`store-item-${item.itemId || "empty"}-${itemIndex}`}>
        <div className="grid grid-cols-[96px_1fr] border-b-2 border-black">
          <ItemImage itemName={item.itemName} src={item.imageUrl} className="h-full w-full border-r-2 border-black" />
          <div className="p-3"><div className="flex justify-between gap-2"><div><p className="font-black">{item.itemName}</p><p className="text-xs font-bold text-stone-500">{item.unit}</p></div><input aria-label={`เปิดใช้ ${item.itemName}`} type="checkbox" checked={value?.isActive ?? false} onChange={(event) => update(item.itemId, { isActive: event.target.checked })} /></div></div>
        </div>
        {value?.isActive && <div className="grid gap-3 p-3 sm:grid-cols-2">
          <label className="text-xs font-bold">ขั้นต่ำ<input className="field mt-1" type="number" min="0" value={value.minQty} onChange={(event) => update(item.itemId, { minQty: Number(event.target.value) })} /></label>
          <label className="text-xs font-bold">เป้าหมาย<input className="field mt-1" type="number" min="0" value={value.targetQty} onChange={(event) => update(item.itemId, { targetQty: Number(event.target.value) })} /></label>
          <label className="text-xs font-bold sm:col-span-2">ตำแหน่งปลายทาง<select className="field mt-1" value={value.defaultLocationId} onChange={(event) => update(item.itemId, { defaultLocationId: event.target.value })}><option value="">ยังไม่กำหนด</option>{locations.data?.filter((location) => location.isActive).map((location, index) => <option key={`location-${location.locationId || "empty"}-${index}`} value={location.locationId}>{location.locationName}</option>)}</select></label>
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={value.allowRequest} onChange={(event) => update(item.itemId, { allowRequest: event.target.checked })} /> อนุญาตให้เบิก</label>
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={value.requireDailyCount} onChange={(event) => update(item.itemId, { requireDailyCount: event.target.checked })} /> ต้องนับทุกวัน</label>
        </div>}
      </article>;
    })}</div>
  </>;
}
