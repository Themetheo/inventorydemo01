"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { displayCountNumber, formatThaiDate } from "@/components/documents/document-formatters";
import { DocumentFooter } from "@/components/documents/document-footer";
import { DocumentHeader } from "@/components/documents/document-header";
import { DocumentMeta } from "@/components/documents/document-meta";
import { DocumentPaper, DocumentPreviewShell } from "@/components/documents/document-page";
import { DocumentSignatures } from "@/components/documents/document-signatures";
import { DocumentToolbar } from "@/components/documents/document-toolbar";
import { StockCountDocumentTable } from "@/components/documents/stock-count-document-table";
import { ActionBar, EmptyState, ErrorBox, FormField, GameButton, GamePanel, PageHeader, StatusBadge } from "@/components/page-kit";
import { get, post } from "@/lib/api";
import { filterValidItems } from "@/lib/items";
import { paginateCountItems } from "@/lib/stock-count-paper";
import type { Category, Item, Location, SessionUser, StockCount, StoreItem } from "@/lib/types";

const rounds = ["OPENING", "MIDDAY", "CLOSING", "ADHOC"] as const;
const PRINT_ROWS_PER_PAGE = 18;

export default function PaperCountPage() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => get<SessionUser>("/auth/me") });
  const locations = useQuery({ queryKey: ["locations"], queryFn: () => get<Location[]>("/locations") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
  const items = useQuery({ queryKey: ["items"], queryFn: () => get<Item[]>("/items") });
  const store = useQuery({ queryKey: ["store-items"], queryFn: () => get<StoreItem[]>("/store-items") });
  const [locationId, setLocationId] = useState("");
  const [countRound, setCountRound] = useState<typeof rounds[number]>("CLOSING");
  const [categoryId, setCategoryId] = useState("");
  const [requireDailyCountOnly, setRequireDailyCountOnly] = useState(true);
  const [sortBy, setSortBy] = useState<"CATEGORY" | "LOCATION">("CATEGORY");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [created, setCreated] = useState<StockCount | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);

  const validItems = useMemo(() => filterValidItems(items.data ?? []), [items.data]);
  const selectableItems = useMemo(() => {
    const activeStore = (store.data ?? []).filter((setting) => setting.isActive && (!requireDailyCountOnly || setting.requireDailyCount));
    return activeStore.flatMap((setting) => {
      const item = validItems.find((candidate) => candidate.itemId === setting.itemId && candidate.isActive);
      if (!item || (categoryId && item.categoryId !== categoryId)) return [];
      const category = categories.data?.find((candidate) => candidate.categoryId === item.categoryId);
      return [{ ...item, categoryName: category?.categoryName ?? "", requireDailyCount: setting.requireDailyCount, defaultLocationId: setting.defaultLocationId }];
    }).sort((a, b) => sortBy === "LOCATION" ? a.defaultLocationId.localeCompare(b.defaultLocationId) || a.itemName.localeCompare(b.itemName) : a.categoryName.localeCompare(b.categoryName) || a.itemName.localeCompare(b.itemName));
  }, [categories.data, categoryId, requireDailyCountOnly, sortBy, store.data, validItems]);

  const createPaper = useMutation({
    mutationFn: () => post<StockCount>("/stock-counts/paper", { locationId, countRound, categoryId: categoryId || undefined, requireDailyCountOnly, sortBy, itemIds: [...selected] }),
    onSuccess: async (value) => {
      const hydrated = value.items?.length ? value : await get<StockCount>(`/stock-counts/${value.countId}`);
      setCreated(hydrated);
    },
  });

  const toggle = (itemId: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    return next;
  });
  const selectAll = () => setSelected(new Set(selectableItems.map((item) => item.itemId)));
  const pages = created?.items ? paginateCountItems(created.items, PRINT_ROWS_PER_PAGE) : [];
  useEffect(() => {
    if (created) window.setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [created]);

  return <div className="min-w-0 overflow-x-clip">
    <div className="screen-only">
      <PageHeader eyebrow="Stock Count · Paper OCR" title="พิมพ์ใบนับสต๊อก" description="สร้างเอกสาร A4 สำหรับเดินนับสินค้า แล้วนำกลับมาสแกน OCR" actions={<Link className="game-button game-button--secondary game-button--md" href="/inventory/count/scan">ไปหน้าสแกน</Link>} />
      <nav className="mb-5 flex flex-wrap gap-2">
        <Link className="game-button game-button--secondary game-button--md" href="/inventory/count">นับในระบบ</Link>
        <span className="game-button game-button--primary game-button--md">พิมพ์ใบนับ</span>
        <Link className="game-button game-button--secondary game-button--md" href="/inventory/count/scan">สแกนใบนับ</Link>
      </nav>

      <GamePanel className="grid gap-4 p-4 lg:grid-cols-4">
        <FormField label="สาขา"><input value={me.data?.branchName ?? ""} disabled /></FormField>
        <FormField label="ตำแหน่งจัดเก็บ" required><select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">เลือกตำแหน่ง</option>{locations.data?.filter((location) => location.isActive).map((location) => <option key={location.locationId} value={location.locationId}>{location.locationName}</option>)}</select></FormField>
        <FormField label="รอบนับ"><select value={countRound} onChange={(event) => setCountRound(event.target.value as typeof countRound)}>{rounds.map((round) => <option key={round} value={round}>{roundLabel(round)}</option>)}</select></FormField>
        <FormField label="หมวดหมู่"><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">ทุกหมวดหมู่</option>{categories.data?.filter((category) => category.isActive).map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select></FormField>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={requireDailyCountOnly} onChange={(event) => setRequireDailyCountOnly(event.target.checked)} /> แสดงเฉพาะ Require Daily Count</label>
        <FormField label="เรียงรายการ"><select value={sortBy} onChange={(event) => setSortBy(event.target.value as "CATEGORY" | "LOCATION")}><option value="CATEGORY">ตามหมวดหมู่</option><option value="LOCATION">ตามตำแหน่งจัดเก็บ</option></select></FormField>
        <div className="flex items-end gap-2 lg:col-span-2"><GameButton variant="secondary" onClick={selectAll} disabled={!selectableItems.length}>เลือกทั้งหมด</GameButton><GameButton variant="ghost" onClick={() => setSelected(new Set())}>ล้างเลือก</GameButton></div>
      </GamePanel>

      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-[var(--color-game-brown)]">รายการสินค้า</h2>
          <div className="flex flex-wrap items-center gap-2">
            <GameButton variant="secondary" onClick={selectAll} disabled={!selectableItems.length}>เลือกสินค้าทั้งหมด</GameButton>
            <GameButton variant="ghost" onClick={() => setSelected(new Set())}>ล้างเลือก</GameButton>
            <StatusBadge tone="info">เลือกแล้ว {selected.size} / {selectableItems.length}</StatusBadge>
          </div>
        </div>
        {!selectableItems.length ? <EmptyState title="ไม่มีรายการที่ตรงเงื่อนไข" description="ลองเปลี่ยนหมวดหมู่หรือปิดตัวกรอง Require Daily Count" /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{selectableItems.map((item) => <button key={item.itemId} type="button" onClick={() => toggle(item.itemId)} className={`rounded-[7px] border p-3 text-left shadow-[2px_3px_0_#d0aa74] ${selected.has(item.itemId) ? "border-[#71331f] bg-[#fff0ce]" : "border-[var(--color-game-border)] bg-[var(--color-game-cream)]"}`}><p className="text-xs font-bold text-[var(--color-game-muted)]">{item.categoryName || item.itemId}</p><p className="mt-1 font-black text-[var(--color-game-brown)]">{item.itemName}</p><p className="mt-1 text-sm text-[var(--color-game-muted)]">{item.unit} · {item.requireDailyCount ? "Daily count" : "Optional"}</p></button>)}</div>}
      </section>

      {createPaper.error && <div className="mt-5"><ErrorBox error={createPaper.error} /></div>}
      {created && <GamePanel className="mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="text-xs font-black text-[var(--color-game-muted)]">สร้างใบนับแล้ว</p><p className="font-black text-[var(--color-game-brown)]">{created.documentCode || created.countId} · {created.items?.length ?? 0} รายการ</p></div>
        <div className="flex flex-wrap gap-2"><GameButton variant="secondary" onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>ดูตัวอย่าง</GameButton><GameButton onClick={() => window.print()}>พิมพ์เอกสาร</GameButton></div>
      </GamePanel>}
      <ActionBar sticky className="mt-6"><GameButton size="lg" disabled={!locationId || !selected.size || createPaper.isPending} onClick={() => createPaper.mutate()}>{createPaper.isPending ? "กำลังสร้าง..." : "สร้างใบนับ"}</GameButton>{created && <GameButton size="lg" variant="secondary" onClick={() => window.print()}>พิมพ์เอกสาร</GameButton>}</ActionBar>
    </div>

    {created && <section ref={previewRef} className="mt-6 scroll-mt-6 print-preview">
      <div className="screen-only mb-3 flex items-center justify-between"><h2 className="text-xl font-black text-[var(--color-game-brown)]">ตัวอย่างเอกสารก่อนพิมพ์</h2><Link className="font-bold underline" href={`/inventory/count/${created.countId}`}>เปิดรายละเอียด</Link></div>
      {created.items?.length ? <StockCountPrintableDocument count={created} pages={pages} /> : <div className="screen-only"><EmptyState title="สร้างเอกสารแล้ว แต่ไม่มีรายการในใบนับ" description="ลองเลือกสินค้าใหม่หรือเปิดรายละเอียดเพื่อตรวจเอกสาร" /></div>}
    </section>}
  </div>;
}

function StockCountPrintableDocument({ count, pages }: { count: StockCount; pages: NonNullable<StockCount["items"]>[] }) {
  const documentNumber = displayCountNumber(count);
  return (
    <DocumentPreviewShell toolbar={<DocumentToolbar backHref="/inventory/count/paper" />}>
      {pages.map((pageItems, pageIndex) => (
        <DocumentPaper key={pageIndex} className={pageIndex < pages.length - 1 ? "document-paper--page-break" : undefined}>
          <DocumentHeader title="ใบนับสต๊อก" documentNumber={documentNumber} />
          <DocumentMeta
            className="document-meta--compact document-meta--stock-count"
            items={[
              { label: "วันที่จัดทำ", value: formatThaiDate(count.countDate || count.createdAt) },
              { label: "รอบนับ", value: roundLabel(count.countRound as typeof rounds[number]) },
              { label: "ตำแหน่งจัดเก็บ", value: count.location?.locationName || count.locationId },
              { label: "หน้า", value: `${pageIndex + 1}/${pages.length}` },
            ]}
          />
          <StockCountDocumentTable items={pageItems} />
          {pageIndex === pages.length - 1 && (
            <>
              <DocumentFooter note={count.note || "กรอกจำนวนจริงในช่องจำนวนที่นับได้ ห้ามคัดลอกยอดคงเหลือจากระบบลงเอกสาร"} />
              <DocumentSignatures slots={[
                { label: "ผู้ตรวจนับ", name: "" },
                { label: "ผู้ทวนสอบ", name: "" },
                { label: "ผู้บันทึกผล", name: "" },
              ]} />
            </>
          )}
        </DocumentPaper>
      ))}
    </DocumentPreviewShell>
  );
}

function roundLabel(round: typeof rounds[number]) {
  return ({ OPENING: "เปิดร้าน", MIDDAY: "กลางวัน", CLOSING: "ปิดร้าน", ADHOC: "นับพิเศษ" } as const)[round] ?? round;
}
