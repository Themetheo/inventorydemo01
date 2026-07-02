"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  BackpackFab,
  BackpackIcon,
  EmptyStatePixel,
  ItemMarketCard,
  PixelButton,
  PixelPanel,
  PixelTab,
  SearchIcon,
  StatusChip,
} from "@/components/inventory-market";
import { get, post } from "@/lib/api";
import type { CreateRequestResult, RequestableItem, SessionUser } from "@/lib/types";
import { useBackpack } from "@/stores/backpack";

const schema = z.object({ note: z.string().max(500) });
type Form = z.infer<typeof schema>;

export default function RequestRoomPage() {
  const router = useRouter();
  const query = useQuery({ queryKey: ["requestable-items"], queryFn: () => get<RequestableItem[]>("/requestable-items") });
  const user = useQuery({ queryKey: ["me"], queryFn: () => get<SessionUser>("/auth/me"), retry: false });
  const bag = useBackpack();
  const requestKey = useRef<string | null>(null);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { note: bag.requestNote } });

  const submit = useMutation({
    mutationFn: (values: Form) => {
      requestKey.current ??= crypto.randomUUID();
      return post<CreateRequestResult>("/stock-requests", {
        note: values.note || undefined,
        items: bag.items.map((v) => ({ itemId: v.itemId, requestedQty: Number(v.requestedQty), unit: v.unit, note: v.note || undefined })),
      }, { "Idempotency-Key": requestKey.current });
    },
    onSuccess: (request) => {
      requestKey.current = null;
      bag.clear();
      router.push(`/inventory/requests/${request.requestId}`);
    },
  });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const categories = useMemo(() => Array.from(
    new Map((query.data ?? []).map((v) => [v.category?.categoryId ?? "other", v.category?.categoryName ?? "อื่น ๆ"])),
    ([id, name]) => ({ id, name }),
  ), [query.data]);
  const filtered = (query.data ?? []).filter((v) => (!category || v.category?.categoryId === category) && v.itemName.toLowerCase().includes(search.toLowerCase()));

  return <div className="request-market -m-4 min-h-[calc(100vh-4rem)] bg-[#fff2bd] p-4 text-[#18130f] sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
    <header className="market-entrance mb-7 border-b-2 border-black pb-6 sm:mb-8 sm:pb-8">
      <div className="mb-5 h-3 border-2 border-black bg-[repeating-linear-gradient(90deg,#d62b20_0_38px,#fffdf4_38px_76px)] shadow-[3px_3px_0_#18130f]" aria-hidden="true" />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 font-mono text-xs font-black uppercase tracking-[.22em] text-red-700">MARKET MODE · STOCK MARKET</p>
          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">เลือกสินค้าในตลาด</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-stone-600 sm:text-base">เลือกของที่ต้องการใช้ แล้วใส่ลงกระเป๋าเบิก</p>
        </div>
        {user.data && <div className="flex flex-wrap gap-2" aria-label="ข้อมูลผู้ใช้งาน">
          <StatusChip>{user.data.branchName}</StatusChip>
          <StatusChip>{user.data.role.toUpperCase()}</StatusChip>
        </div>}
      </div>
    </header>

    <section aria-labelledby="market-zones" className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">SELECT YOUR STALL</p>
          <h2 id="market-zones" className="text-xl font-black sm:text-2xl">โซนสินค้า</h2>
        </div>
        <span className="text-xs font-bold text-stone-500">{filtered.length} รายการ</span>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0" role="group" aria-label="เลือกโซนสินค้า">
        <PixelTab label="ทั้งหมด" code="ALL STALLS" active={!category} onClick={() => setCategory("")} />
        {categories.map((v, index) => <PixelTab key={v.id} label={v.name} code={`STALL ${String(index + 1).padStart(2, "0")}`} active={category === v.id} onClick={() => setCategory(v.id)} />)}
      </div>
    </section>

    <section aria-labelledby="market-items">
      <label className="relative mb-6 block">
        <span className="sr-only">ค้นหาของในตลาด</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true"><SearchIcon /></span>
        <input className="market-field min-h-12 w-full border-2 border-black bg-white py-3 pl-12 pr-4 font-bold shadow-[4px_4px_0_#18130f] outline-none transition-shadow placeholder:font-medium placeholder:text-stone-400 focus:shadow-[4px_4px_0_#d62b20] focus-visible:ring-4 focus-visible:ring-red-600 focus-visible:ring-offset-2" placeholder="ค้นหาของในตลาด" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">ITEM SHELF</p>
          <h2 id="market-items" className="text-xl font-black sm:text-2xl">แผงสินค้า</h2>
        </div>
        {bag.items.length > 0 && <span className="text-xs font-black text-red-700">พร้อมเบิก {bag.items.length} รายการ</span>}
      </div>

      {query.isLoading ? <LoadingMarket /> : query.isError ? <MarketError error={query.error} retry={() => query.refetch()} /> : !filtered.length ? <EmptyStatePixel title="ไม่มีสินค้าในโซนนี้" description="ลองเปลี่ยนโซนหรือค้นหาด้วยคำอื่น" /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        {filtered.map((item) => {
          const selected = bag.items.some((v) => v.itemId === item.itemId);
          return <ItemMarketCard key={item.itemId} item={item} selected={selected} onToggle={() => selected ? bag.remove(item.itemId) : bag.add({ itemId: item.itemId, itemName: item.itemName, unit: item.unit })} />;
        })}
      </div>}
    </section>

    <BackpackFab count={bag.items.length} onClick={() => setOpen(true)} />

    {open && <div className="market-backdrop fixed inset-0 z-50 bg-black/60" onMouseDown={(e) => { if (e.currentTarget === e.target) setOpen(false); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="backpack-title" className="market-drawer absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto border-t-2 border-black bg-[#fff9e5] p-4 shadow-[0_-6px_0_#d62b20] sm:left-auto sm:top-0 sm:w-[480px] sm:border-l-2 sm:border-t-0 sm:p-6 sm:shadow-[-6px_0_0_#d62b20]">
        <div className="mb-5 flex items-start justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">INVENTORY BAG</p>
            <h2 id="backpack-title" className="mt-1 flex items-center gap-2 text-2xl font-black"><BackpackIcon /> กระเป๋าเบิกของ</h2>
            <p className="mt-1 text-sm text-stone-500">ตรวจสอบของที่เลือกก่อนส่งคำขอ</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="ปิดกระเป๋าเบิก" className="market-button grid min-h-11 min-w-11 place-items-center border-2 border-black bg-white text-xl font-black shadow-[3px_3px_0_#18130f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">×</button>
        </div>

        {!bag.items.length ? <EmptyStatePixel title="ยังไม่มีของในกระเป๋า" description="ลองเลือกของจากตลาดก่อน" /> : <form onSubmit={form.handleSubmit((v) => { if (!submit.isPending) submit.mutate(v); })}>
          <div className="mb-4 flex items-center justify-between border-2 border-black bg-amber-100 px-3 py-2 text-sm font-black">
            <span>ของที่เลือกทั้งหมด</span><span>{bag.items.length} รายการ</span>
          </div>
          <div className="space-y-4">{bag.items.map((v, index) => <PixelPanel className="p-3.5 shadow-[4px_4px_0_#18130f]" key={v.itemId}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-mono text-[10px] font-black tracking-wider text-red-700">SLOT {String(index + 1).padStart(2, "0")}</p><p className="truncate font-black">{v.itemName}</p></div>
              <button type="button" className="min-h-11 px-2 text-sm font-black text-red-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600" aria-label={`ลบ ${v.itemName} ออกจากกระเป๋า`} onClick={() => bag.remove(v.itemId)}>ลบ</button>
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <label><span className="mb-1 block text-xs font-bold">จำนวน</span><input aria-label={`จำนวน ${v.itemName}`} className="market-field min-h-11 w-full border-2 border-black bg-white px-3 outline-none focus-visible:ring-4 focus-visible:ring-red-600" inputMode="decimal" type="number" min="0.01" step="0.01" value={v.requestedQty} onChange={(e) => bag.update(v.itemId, { requestedQty: Number(e.target.value) })} /></label>
              <span className="self-end border-2 border-black bg-amber-100 px-3 py-2.5 text-sm font-black">{v.unit}</span>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold">หมายเหตุรายการ</span><input className="market-field min-h-11 w-full border-2 border-black bg-white px-3 outline-none placeholder:text-stone-400 focus-visible:ring-4 focus-visible:ring-red-600" placeholder="ระบุเพิ่มเติม (ถ้ามี)" value={v.note} onChange={(e) => bag.update(v.itemId, { note: e.target.value })} /></label>
          </PixelPanel>)}</div>

          <label className="mt-5 block"><span className="mb-2 block font-black">หมายเหตุทั้งคำขอ</span><textarea className="market-field min-h-24 w-full resize-y border-2 border-black bg-white p-3 outline-none placeholder:text-stone-400 focus-visible:ring-4 focus-visible:ring-red-600" placeholder="ข้อความถึงทีมสต๊อก (ถ้ามี)" {...form.register("note")} onChange={(e) => { form.setValue("note", e.target.value); bag.setRequestNote(e.target.value); }} /></label>
          {submit.error && <div className="mt-4"><MarketError error={submit.error} /></div>}
          <PixelButton className="mt-5 w-full text-base" disabled={submit.isPending || !bag.items.length || bag.items.some((v) => !Number.isFinite(v.requestedQty) || v.requestedQty <= 0)}>{submit.isPending ? "กำลังส่งคำขอ..." : "ส่งคำขอเบิก"}</PixelButton>
        </form>}
      </aside>
    </div>}
  </div>;
}

function LoadingMarket() {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4" aria-label="กำลังโหลดสินค้า">
    {Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse border-2 border-black bg-white p-3 shadow-[5px_5px_0_#18130f]"><div className="aspect-square bg-amber-100"/><div className="mt-4 h-5 w-3/4 bg-stone-200"/><div className="mt-2 h-3 w-1/2 bg-stone-200"/><div className="mt-5 h-11 bg-stone-200"/></div>)}
  </div>;
}

function MarketError({ error, retry }: { error: unknown; retry?: () => void }) {
  const code = process.env.NODE_ENV === "development" && error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "";
  return <PixelPanel className="border-red-600 bg-red-50 p-4 shadow-[5px_5px_0_#d62b20]" >
    <p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">SYSTEM ALERT</p>
    <p className="mt-1 font-black text-red-950">{error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ"}{code ? ` (${code})` : ""}</p>
    {retry && <button type="button" className="mt-3 min-h-11 font-black text-red-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600" onClick={retry}>ลองใหม่อีกครั้ง</button>}
  </PixelPanel>;
}
