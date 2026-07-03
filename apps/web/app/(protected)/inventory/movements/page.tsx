"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorBox, PageHeader } from "@/components/page-kit";
import { CartViewportPortal as ViewportPortal } from "@/components/pixel-cart-drawer";
import { MovementProductCard, MovementTypePicker, QuantityStepper } from "@/components/stock-movement-ui";
import { get, post } from "@/lib/api";
import { lockBodyScroll } from "@/lib/body-scroll-lock";
import { filterValidItems } from "@/lib/items";
import { MOVEMENT_ACTIONS, movementLocationNeeds, type MovementType } from "@/lib/movement-workflow";
import type { Category, Item, Location, Movement, StockBalance } from "@/lib/types";

const schema = z.object({
  movementType: z.enum(["RECEIVE", "ISSUE", "TRANSFER", "WASTE", "RETURN", "ADJUSTMENT"]),
  itemId: z.string().min(1),
  fromLocationId: z.string(),
  toLocationId: z.string(),
  qty: z.coerce.number().positive(),
  note: z.string(),
  adjustmentDirection: z.enum(["increase", "decrease"]),
});
type Form = z.infer<typeof schema>;
const defaults: Form = { movementType: "RECEIVE", itemId: "", fromLocationId: "", toLocationId: "", qty: 1, note: "", adjustmentDirection: "increase" };

export default function MovementsPage() {
  const router = useRouter();
  const client = useQueryClient();
  const items = useQuery({ queryKey: ["items"], queryFn: () => get<Item[]>("/items") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
  const locations = useQuery({ queryKey: ["locations"], queryFn: () => get<Location[]>("/locations") });
  const balances = useQuery({ queryKey: ["balances"], queryFn: () => get<StockBalance[]>("/stock-balances") });
  const history = useQuery({ queryKey: ["movements"], queryFn: () => get<Movement[]>("/stock-movements") });
  const [historyFilter, setHistoryFilter] = useState<"" | MovementType>("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const form = useForm<Form>({ defaultValues: defaults });
  const type = form.watch("movementType") as MovementType;
  const adjustmentDirection = form.watch("adjustmentDirection");
  const qty = Number(form.watch("qty"));

  const validItems = useMemo(() => filterValidItems(items.data ?? []).filter((item) => item.isActive), [items.data]);
  const balanceByItem = useMemo(() => (balances.data ?? []).reduce<Record<string, number>>((totals, balance) => {
    totals[balance.itemId] = (totals[balance.itemId] ?? 0) + balance.currentQty;
    return totals;
  }, {}), [balances.data]);
  const filteredItems = useMemo(() => validItems.filter((item) =>
    (!category || item.categoryId === category)
    && item.itemName.toLowerCase().includes(search.trim().toLowerCase()),
  ), [validItems, category, search]);
  const selectedItem = validItems.find((item) => item.itemId === selectedItemId);
  const visibleHistory = useMemo(() => (history.data ?? []).filter((movement) => !historyFilter || movement.movementType === historyFilter), [history.data, historyFilter]);
  const { needsFrom, needsTo } = movementLocationNeeds(type, adjustmentDirection);

  const save = useMutation({
    mutationFn: (input: Form) => {
      const value = schema.parse(input);
      const item = validItems.find((candidate) => candidate.itemId === value.itemId);
      return post("/stock-movements", { ...value, unit: item?.unit ?? "" });
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["movements"] }),
        client.invalidateQueries({ queryKey: ["balances"] }),
      ]);
      form.reset(defaults);
      setSelectedItemId("");
    },
  });

  useEffect(() => {
    if (!selectedItem) return;
    const unlock = lockBodyScroll(document.body);
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !save.isPending) setSelectedItemId(""); };
    document.addEventListener("keydown", close);
    return () => { unlock(); document.removeEventListener("keydown", close); };
  }, [selectedItem, save.isPending]);

  const chooseType = (value: MovementType) => {
    form.setValue("movementType", value);
    form.setValue("itemId", "");
    setSelectedItemId("");
  };
  const chooseItem = (itemId: string) => {
    form.setValue("itemId", itemId, { shouldValidate: true });
    form.setValue("qty", 1);
    setSelectedItemId(itemId);
  };
  const closePanel = () => {
    if (save.isPending) return;
    form.setValue("itemId", "");
    setSelectedItemId("");
  };

  return <div className="movement-game -m-4 min-h-[calc(100vh-4rem)] overflow-x-clip bg-[#fff2bd] p-4 text-[#18130f] sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
    <PageHeader eyebrow="Stock Movement · Game Mode" title="รับเข้าและเคลื่อนไหว" description="เลือกงาน เลือกสินค้า แล้วตรวจรายละเอียดก่อนยืนยัน" />

    <section aria-labelledby="movement-step-1" className="border-b-2 border-black pb-7">
      <p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">STEP 01</p>
      <h2 id="movement-step-1" className="mb-4 mt-1 text-2xl font-black">เลือกประเภทงาน</h2>
      <MovementTypePicker value={type} onChange={chooseType} onCount={() => router.push("/inventory/count")} />
    </section>

    <section aria-labelledby="movement-step-2" className="py-7">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">STEP 02 · {MOVEMENT_ACTIONS.find((action) => action.value === type)?.label}</p><h2 id="movement-step-2" className="mt-1 text-2xl font-black">เลือกสินค้า</h2></div>
        <span className="text-sm font-black">{filteredItems.length} รายการ</span>
      </div>
      <label className="mb-4 block max-w-3xl"><span className="sr-only">ค้นหาสินค้า</span><input className="min-h-12 w-full border-2 border-black bg-white px-4 font-bold shadow-[4px_4px_0_#18130f] outline-none placeholder:text-stone-400 focus:shadow-[4px_4px_0_#d62b20]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อสินค้า" /></label>
      <div className="mb-5 flex snap-x gap-3 overflow-x-auto px-1 pb-2" aria-label="กรองหมวดหมู่">
        <FilterButton label="ทั้งหมด" active={!category} onClick={() => setCategory("")} />
        {(categories.data ?? []).filter((value) => value.categoryId && value.categoryName).map((value) => <FilterButton key={value.categoryId} label={value.categoryName} active={category === value.categoryId} onClick={() => setCategory(value.categoryId)} />)}
      </div>
      {items.isError ? <ErrorBox error={items.error} /> : !filteredItems.length ? <div className="border-2 border-dashed border-black bg-white p-10 text-center font-black">ไม่พบสินค้าที่เลือกได้</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] sm:gap-5">
        {filteredItems.map((item) => <MovementProductCard key={item.itemId} item={item} balance={balanceByItem[item.itemId] ?? 0} onSelect={chooseItem} />)}
      </div>}
    </section>

    <section aria-labelledby="movement-history" className="border-t-2 border-black pt-7">
      <div className="mb-4"><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">MOVEMENT LOG</p><h2 id="movement-history" className="mt-1 text-2xl font-black">ประวัติล่าสุด</h2></div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2"><FilterButton label="ทั้งหมด" active={!historyFilter} onClick={() => setHistoryFilter("")} />{MOVEMENT_ACTIONS.map((action) => <FilterButton key={action.value} label={action.label} active={historyFilter === action.value} onClick={() => setHistoryFilter(action.value)} />)}</div>
      {history.isError ? <ErrorBox error={history.error} /> : <div className="divide-y-2 divide-black border-2 border-black bg-white shadow-[5px_5px_0_#18130f]">{visibleHistory.slice(0, 30).map((movement) => <article className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 p-4" key={movement.movementId}><div className="min-w-0"><p className="truncate font-black">{validItems.find((item) => item.itemId === movement.itemId)?.itemName || movement.itemId}</p><p className="mt-1 text-xs font-bold text-stone-500">{movement.movementType} · {movement.movementDate}{movement.note ? ` · ${movement.note}` : ""}</p></div><p className="font-black">{movement.qty} {movement.unit}</p></article>)}</div>}
    </section>

    <ViewportPortal>{selectedItem && <div className="fixed inset-0 z-[60] overflow-hidden">
      <button type="button" aria-label="ยกเลิก Movement" onClick={closePanel} className="absolute inset-0 bg-black/60" />
      <form onSubmit={form.handleSubmit((value) => { if (!save.isPending) save.mutate(value); })} className="absolute inset-y-0 right-0 flex h-[100dvh] w-full min-w-0 max-w-[460px] flex-col border-l-2 border-black bg-[#fff9e5] shadow-[-7px_0_0_#d62b20]">
        <header className="shrink-0 border-b-2 border-black p-4 sm:p-6"><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">STEP 03 · CONFIRM ACTION</p><div className="mt-2 flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-2xl font-black">{selectedItem.itemName}</h2><p className="mt-1 text-sm font-bold text-stone-500">{MOVEMENT_ACTIONS.find((action) => action.value === type)?.label} · คงเหลือ {balanceByItem[selectedItem.itemId] ?? 0} {selectedItem.unit}</p></div><button type="button" onClick={closePanel} className="min-h-12 min-w-12 border-2 border-black bg-white text-xl font-black shadow-[3px_3px_0_#18130f]">×</button></div></header>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {type === "ADJUSTMENT" && <fieldset><legend className="mb-2 font-black">ทิศทางการปรับ</legend><div className="grid grid-cols-2 gap-3"><ChoiceButton label="เพิ่มยอด" active={adjustmentDirection === "increase"} onClick={() => form.setValue("adjustmentDirection", "increase")} /><ChoiceButton label="ลดยอด" active={adjustmentDirection === "decrease"} onClick={() => form.setValue("adjustmentDirection", "decrease")} /></div></fieldset>}
          {needsFrom && <label className="block font-black">ตำแหน่งต้นทาง<select className="field mt-2" {...form.register("fromLocationId")}><option value="">เลือกต้นทาง</option>{locations.data?.filter((location) => location.isActive).map((location) => <option key={location.locationId} value={location.locationId}>{location.locationName}</option>)}</select></label>}
          {needsTo && <label className="block font-black">ตำแหน่งปลายทาง<select className="field mt-2" {...form.register("toLocationId")}><option value="">เลือกปลายทาง</option>{locations.data?.filter((location) => location.isActive).map((location) => <option key={location.locationId} value={location.locationId}>{location.locationName}</option>)}</select></label>}
          <QuantityStepper value={Number.isFinite(qty) ? qty : 0.01} unit={selectedItem.unit} onChange={(value) => form.setValue("qty", value, { shouldValidate: true })} />
          <label className="block font-black">หมายเหตุ<textarea className="field mt-2 min-h-24 resize-y" placeholder="ระบุเหตุผลหรือรายละเอียด (ถ้ามี)" {...form.register("note")} /></label>
          {save.error && <ErrorBox error={save.error} />}
        </div>
        <footer className="grid shrink-0 grid-cols-2 gap-3 border-t-2 border-black bg-[#fff9e5] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6"><button type="button" onClick={closePanel} disabled={save.isPending} className="btn-secondary min-h-12">ยกเลิก</button><button type="submit" disabled={save.isPending} className="btn-primary min-h-12">{save.isPending ? "กำลังบันทึก..." : "ยืนยันรายการ"}</button></footer>
      </form>
    </div>}</ViewportPortal>
  </div>;
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`min-h-12 shrink-0 snap-start border-2 border-black px-4 font-black shadow-[3px_3px_0_#18130f] ${active ? "bg-red-600 text-white" : "bg-white hover:bg-amber-100"}`}>{label}</button>;
}

function ChoiceButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-12 border-2 border-black px-3 font-black shadow-[3px_3px_0_#18130f] ${active ? "bg-red-600 text-white" : "bg-white"}`}>{label}</button>;
}
