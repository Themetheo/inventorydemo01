"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ActionBar, DataTableShell, EmptyState, ErrorBox, FormField, GameButton, GamePanel, PageHeader, StatusBadge } from "@/components/page-kit";
import { get, patch, post } from "@/lib/api";
import { countReviewSummary, isCountCompletable, validateStockCountUpload } from "@/lib/stock-count-paper";
import type { StockCount, StockCountItem } from "@/lib/types";

type UploadPreview = { file: File; fingerprint: string; pageNumber: number; previewUrl: string };

export default function ScanCountPage() {
  const client = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const counts = useQuery({ queryKey: ["counts"], queryFn: () => get<StockCount[]>("/stock-counts") });
  const [countId, setCountId] = useState("");
  const [uploads, setUploads] = useState<UploadPreview[]>([]);
  const [uploadError, setUploadError] = useState("");
  const detail = useQuery({ queryKey: ["count-detail", countId], queryFn: () => get<StockCount>(`/stock-counts/${countId}`), enabled: Boolean(countId) });
  const [draftItems, setDraftItems] = useState<Record<string, { countedQty: string; note: string; confirmed: boolean }>>({});

  const paperCounts = useMemo(() => (counts.data ?? []).filter((count) => count.source === "PAPER_OCR" && count.countStatus !== "COMPLETED"), [counts.data]);
  const activeCount = detail.data;
  const items = activeCount?.items ?? [];
  const summary = countReviewSummary(items.map((item) => ({ ...item, countedQty: draftItems[item.countItemId]?.countedQty === "" ? item.countedQty : Number(draftItems[item.countItemId]?.countedQty ?? item.countedQty), reviewStatus: draftItems[item.countItemId]?.confirmed ? "CONFIRMED" : item.reviewStatus })));

  const ocr = useMutation({
    mutationFn: () => post<StockCount>(`/stock-counts/${countId}/ocr`, { files: uploads.map((upload) => ({ fileName: upload.file.name, mimeType: upload.file.type, size: upload.file.size, pageNumber: upload.pageNumber, fingerprint: upload.fingerprint })) }),
    onSuccess: (value) => {
      setDraftItems(Object.fromEntries((value.items ?? []).map((item) => [item.countItemId, { countedQty: item.countedQty === null ? "" : String(item.countedQty), note: item.note, confirmed: item.reviewStatus === "CONFIRMED" }])));
      client.setQueryData(["count-detail", countId], value);
      client.invalidateQueries({ queryKey: ["counts"] });
    },
  });
  const saveDraft = useMutation({
    mutationFn: () => patch<StockCount>(`/stock-counts/${countId}/items`, { saveAsDraft: true, items: buildReviewPayload(items, draftItems, false) }),
    onSuccess: (value) => {
      client.setQueryData(["count-detail", countId], value);
      client.invalidateQueries({ queryKey: ["counts"] });
    },
  });
  const complete = useMutation({
    mutationFn: async () => {
      await patch<StockCount>(`/stock-counts/${countId}/items`, { saveAsDraft: true, items: buildReviewPayload(items, draftItems, true) });
      return post<StockCount>(`/stock-counts/${countId}/complete`);
    },
    onSuccess: (value) => {
      client.setQueryData(["count-detail", countId], value);
      client.invalidateQueries({ queryKey: ["counts"] });
      client.invalidateQueries({ queryKey: ["balances"] });
    },
  });

  function addFiles(files: FileList | File[]) {
    setUploadError("");
    const fingerprints = new Set(uploads.map((upload) => upload.fingerprint));
    const next = [...uploads];
    for (const file of Array.from(files)) {
      const result = validateStockCountUpload(file, fingerprints);
      if (!result.ok) { setUploadError(result.message); continue; }
      fingerprints.add(result.fingerprint);
      next.push({ file, fingerprint: result.fingerprint, pageNumber: next.length + 1, previewUrl: URL.createObjectURL(file) });
    }
    setUploads(next);
  }
  function updateDraft(item: StockCountItem, patchValue: Partial<{ countedQty: string; note: string; confirmed: boolean }>) {
    const base = { countedQty: item.countedQty === null ? "" : String(item.countedQty), note: item.note, confirmed: item.reviewStatus === "CONFIRMED" };
    setDraftItems((current) => ({ ...current, [item.countItemId]: { ...base, ...current[item.countItemId], ...patchValue } }));
  }

  return <div className="min-w-0 overflow-x-clip">
    <PageHeader eyebrow="Stock Count · OCR" title="สแกนใบนับสต๊อก" description="อัปโหลดรูปหรือ PDF แล้วตรวจสอบค่าที่ OCR อ่านได้ก่อนปรับยอด" actions={<Link className="game-button game-button--secondary game-button--md" href="/inventory/count/paper">สร้างใบนับ</Link>} />
    <nav className="mb-5 flex flex-wrap gap-2">
      <Link className="game-button game-button--secondary game-button--md" href="/inventory/count">นับในระบบ</Link>
      <Link className="game-button game-button--secondary game-button--md" href="/inventory/count/paper">พิมพ์ใบนับ</Link>
      <span className="game-button game-button--primary game-button--md">สแกนใบนับ</span>
    </nav>

    <GamePanel className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <FormField label="เอกสารใบนับ"><select value={countId} onChange={(event) => { setCountId(event.target.value); setDraftItems({}); }}><option value="">เลือก Document Code</option>{paperCounts.map((count) => <option key={count.countId} value={count.countId}>{count.documentCode || count.countId} · {count.countRound}</option>)}</select></FormField>
      <div className="rounded-[7px] border-2 border-dashed border-[var(--color-game-border-strong)] bg-[var(--color-game-cream)] p-4 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
        <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => event.target.files && addFiles(event.target.files)} />
        <p className="font-black text-[var(--color-game-brown)]">ลากไฟล์มาวาง หรือเลือกไฟล์เอกสาร</p>
        <p className="mt-1 text-sm text-[var(--color-game-muted)]">รองรับ JPG, JPEG, PNG, WebP และ PDF หลายหน้า</p>
        <GameButton className="mt-3" variant="secondary" onClick={() => inputRef.current?.click()}>เลือกไฟล์</GameButton>
        {uploadError && <p className="mt-3 text-sm font-bold text-[var(--color-game-danger)]">{uploadError}</p>}
      </div>
    </GamePanel>

    {uploads.length > 0 && <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{uploads.map((upload, index) => <GamePanel key={upload.fingerprint} className="p-3">
      <div className="mb-2 flex items-center justify-between gap-2"><strong>หน้า {upload.pageNumber}</strong><button className="text-sm font-bold underline" onClick={() => setUploads((current) => current.filter((_, i) => i !== index).map((value, i) => ({ ...value, pageNumber: i + 1 })))}>ลบ</button></div>
      {upload.file.type === "application/pdf" ? <div className="grid aspect-[3/4] place-items-center border bg-white font-black">PDF</div> : <img src={upload.previewUrl} alt={upload.file.name} className="aspect-[3/4] w-full rounded border object-contain bg-white" />}
      <p className="mt-2 truncate text-xs font-bold text-[var(--color-game-muted)]">{upload.file.name}</p>
    </GamePanel>)}</section>}

    {(detail.error || ocr.error || saveDraft.error || complete.error) && <div className="mt-5"><ErrorBox error={detail.error || ocr.error || saveDraft.error || complete.error} /></div>}
    {!countId ? <EmptyState className="mt-5" title="เลือก Document Code เพื่อเริ่มสแกน" /> : detail.isLoading ? <EmptyState className="mt-5" title="กำลังโหลดรายการนับ" /> : activeCount && <>
      <ActionBar className="mt-5"><GameButton disabled={!uploads.length || ocr.isPending} onClick={() => ocr.mutate()}>{ocr.isPending ? "กำลัง OCR..." : "เริ่ม OCR"}</GameButton><Link className="game-button game-button--ghost game-button--md" href={`/inventory/count/${activeCount.countId}`}>ดูรายละเอียด</Link></ActionBar>

      <section className="mt-5 grid gap-3 sm:grid-cols-5">{[["ทั้งหมด", summary.total], ["อ่านสำเร็จ", summary.recognized], ["ต้องตรวจสอบ", summary.needsReview], ["ยังไม่มีค่า", summary.unread], ["ผู้ใช้แก้ไข", summary.edited]].map(([label, value]) => <GamePanel key={label} className="p-3 text-center"><p className="text-xs font-black text-[var(--color-game-muted)]">{label}</p><p className="text-2xl font-black text-[var(--color-game-brown)]">{value}</p></GamePanel>)}</section>

      <DataTableShell className="mt-5"><table><thead><tr><th>รูปต้นฉบับ</th><th>สินค้า</th><th>OCR</th><th>แก้ไขจำนวน</th><th>สถานะ</th></tr></thead><tbody>{items.map((item) => {
        const draft = draftItems[item.countItemId] ?? { countedQty: item.countedQty === null ? "" : String(item.countedQty), note: item.note, confirmed: item.reviewStatus === "CONFIRMED" };
        const invalid = draft.countedQty !== "" && Number(draft.countedQty) < 0;
        return <tr key={item.countItemId}><td><div className="h-20 w-16 border bg-white text-center text-xs font-bold leading-[5rem]">Row {item.rowNumber}</div></td><td><p className="font-black text-[var(--color-game-brown)]">{item.item?.itemName ?? item.itemId}</p><p className="text-xs text-[var(--color-game-muted)]">{item.itemId} · {item.unit}</p></td><td><p className="font-mono font-black">{item.ocrRawValue || "อ่านไม่ได้"}</p><p className="text-xs text-[var(--color-game-muted)]">confidence {(item.ocrConfidence * 100).toFixed(0)}%</p></td><td><input className="field max-w-32" inputMode="decimal" type="number" min="0" step="0.001" value={draft.countedQty} onChange={(event) => updateDraft(item, { countedQty: event.target.value, confirmed: false })} />{invalid && <p className="mt-1 text-xs font-bold text-[var(--color-game-danger)]">ห้ามติดลบ</p>}</td><td><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={draft.confirmed} disabled={draft.countedQty === "" || invalid} onChange={(event) => updateDraft(item, { confirmed: event.target.checked })} /> ยืนยันแล้ว</label><StatusBadge className="mt-2" tone={draft.confirmed ? "success" : item.reviewStatus === "NEEDS_REVIEW" ? "warning" : item.reviewStatus === "UNREAD" ? "danger" : "info"}>{draft.confirmed ? "CONFIRMED" : item.reviewStatus}</StatusBadge></td></tr>;
      })}</tbody></table></DataTableShell>
      <ActionBar sticky className="mt-6"><GameButton variant="secondary" disabled={saveDraft.isPending || !items.length} onClick={() => saveDraft.mutate()}>{saveDraft.isPending ? "กำลังบันทึก..." : "บันทึกร่าง"}</GameButton><GameButton disabled={complete.isPending || !isCountCompletable({ items: items.map((item) => ({ ...item, countedQty: draftItems[item.countItemId]?.countedQty === "" ? null : Number(draftItems[item.countItemId]?.countedQty ?? item.countedQty), reviewStatus: draftItems[item.countItemId]?.confirmed ? "CONFIRMED" : item.reviewStatus })) })} onClick={() => complete.mutate()}>{complete.isPending ? "กำลังยืนยัน..." : "ยืนยันผลนับ"}</GameButton></ActionBar>
    </>}
  </div>;
}

function buildReviewPayload(items: StockCountItem[], draftItems: Record<string, { countedQty: string; note: string; confirmed: boolean }>, forceConfirmed: boolean) {
  return items.map((item) => {
    const draft = draftItems[item.countItemId] ?? { countedQty: item.countedQty === null ? "" : String(item.countedQty), note: item.note, confirmed: item.reviewStatus === "CONFIRMED" };
    return { countItemId: item.countItemId, countedQty: draft.countedQty === "" ? null : Number(draft.countedQty), note: draft.note, reviewStatus: forceConfirmed || draft.confirmed ? "CONFIRMED" : draft.countedQty === "" ? "UNREAD" : item.ocrConfidence < 0.8 ? "NEEDS_REVIEW" : "OCR_RECOGNIZED" };
  });
}
