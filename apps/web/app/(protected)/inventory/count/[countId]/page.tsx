"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ActionBar, DataTableShell, EmptyState, ErrorBox, GameButton, GamePanel, PageHeader, StatusBadge } from "@/components/page-kit";
import { get, post } from "@/lib/api";
import { countReviewSummary, isCountCompletable } from "@/lib/stock-count-paper";
import type { StockCount } from "@/lib/types";

export default function CountDetailPage() {
  const params = useParams<{ countId: string }>();
  const countId = params.countId;
  const client = useQueryClient();
  const detail = useQuery({ queryKey: ["count-detail", countId], queryFn: () => get<StockCount>(`/stock-counts/${countId}`), enabled: Boolean(countId) });
  const complete = useMutation({
    mutationFn: () => post<StockCount>(`/stock-counts/${countId}/complete`),
    onSuccess: (value) => {
      client.setQueryData(["count-detail", countId], value);
      client.invalidateQueries({ queryKey: ["counts"] });
      client.invalidateQueries({ queryKey: ["balances"] });
    },
  });

  if (detail.isLoading) return <EmptyState title="กำลังโหลดรายละเอียดการนับ" />;
  if (detail.error) return <ErrorBox error={detail.error} retry={() => detail.refetch()} />;
  const count = detail.data;
  if (!count) return <EmptyState title="ไม่พบรายการนับ" />;
  const items = count.items ?? [];
  const summary = countReviewSummary(items);

  return <div className="min-w-0 overflow-x-clip">
    <PageHeader eyebrow="Stock Count Detail" title={count.documentCode || count.countId} description={`${count.branch?.branchName ?? count.branchId} · ${count.location?.locationName ?? count.locationId} · ${count.countRound}`} actions={<div className="flex flex-wrap gap-2"><Link className="game-button game-button--secondary game-button--md" href="/inventory/count">ประวัติการนับ</Link>{count.countStatus !== "COMPLETED" && <Link className="game-button game-button--secondary game-button--md" href={`/inventory/count/scan?countId=${count.countId}`}>รีวิว OCR</Link>}</div>} />
    {complete.error && <div className="mb-5"><ErrorBox error={complete.error} /></div>}

    <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <GamePanel className="grid gap-3 p-4 sm:grid-cols-3">
        <Meta label="Document Code" value={count.documentCode || "-"} />
        <Meta label="วันที่/รอบ" value={`${count.countDate} · ${count.countRound}`} />
        <Meta label="สถานะ" value={count.countStatus} badge />
        <Meta label="Source" value={count.source} />
        <Meta label="OCR Status" value={count.ocrStatus} badge />
        <Meta label="OCR Confidence" value={`${(count.ocrConfidence * 100).toFixed(0)}%`} />
        <Meta label="ผู้สร้าง" value={count.counter?.displayName ?? count.countedBy} />
        <Meta label="ผู้รีวิว" value={count.reviewer?.displayName ?? (count.reviewedBy || "-")} />
        <Meta label="ผู้ยืนยัน" value={count.completer?.displayName ?? (count.completedBy || "-")} />
      </GamePanel>
      <GamePanel className="p-4">
        <h2 className="font-black text-[var(--color-game-brown)]">Timeline</h2>
        <ol className="mt-3 space-y-2 text-sm"><li>สร้าง: {count.createdAt || "-"}</li><li>พิมพ์: {count.printedAt || "-"}</li><li>อัปโหลด: {count.uploadedAt || "-"}</li><li>รีวิว: {count.reviewedAt || "-"}</li><li>Completed: {count.completedAt || "-"}</li></ol>
        {count.originalImageUrl && <p className="mt-3 break-words text-xs font-bold text-[var(--color-game-muted)]">ไฟล์ต้นฉบับ: {count.originalImageUrl}</p>}
      </GamePanel>
    </section>

    <section className="mt-5 grid gap-3 sm:grid-cols-5">{[["ทั้งหมด", summary.total], ["อ่านสำเร็จ", summary.recognized], ["ต้องตรวจสอบ", summary.needsReview], ["ยังไม่มีค่า", summary.unread], ["ผู้ใช้แก้ไข", summary.edited]].map(([label, value]) => <GamePanel key={label} className="p-3 text-center"><p className="text-xs font-black text-[var(--color-game-muted)]">{label}</p><p className="text-2xl font-black text-[var(--color-game-brown)]">{value}</p></GamePanel>)}</section>

    <DataTableShell className="mt-5"><table><thead><tr><th>#</th><th>สินค้า</th><th>System</th><th>Counted</th><th>Variance</th><th>OCR</th><th>แก้ไข</th><th>Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.countItemId}><td>{item.rowNumber}</td><td><p className="font-black">{item.item?.itemName ?? item.itemId}</p><p className="text-xs text-[var(--color-game-muted)]">{item.itemId} · {item.unit}</p></td><td>{item.systemQty}</td><td>{item.countedQty ?? "-"}</td><td className={item.varianceQty < 0 ? "text-[var(--color-game-danger)]" : item.varianceQty > 0 ? "text-[var(--color-game-warning)]" : ""}>{item.varianceQty}</td><td>{item.ocrRawValue || "-"}<p className="text-xs text-[var(--color-game-muted)]">{(item.ocrConfidence * 100).toFixed(0)}%</p></td><td>{item.reviewedQty ?? "-"}</td><td><StatusBadge tone={item.reviewStatus === "CONFIRMED" ? "success" : item.reviewStatus === "NEEDS_REVIEW" ? "warning" : item.reviewStatus === "UNREAD" ? "danger" : "info"}>{item.reviewStatus}</StatusBadge></td></tr>)}</tbody></table></DataTableShell>

    <GamePanel className="mt-5 p-4">
      <h2 className="font-black text-[var(--color-game-brown)]">Adjustment Movements</h2>
      {!count.movements?.length ? <p className="mt-2 text-sm text-[var(--color-game-muted)]">ยังไม่มี movement จากรายการนี้</p> : <ul className="mt-3 grid gap-2">{count.movements.map((movement) => <li key={movement.movementId} className="rounded border border-[var(--color-game-border)] bg-[var(--color-game-cream-active)] p-3 text-sm"><strong>{movement.movementId}</strong> · {movement.itemId} · {movement.qty} {movement.unit} · {movement.fromLocationId ? "ลด" : "เพิ่ม"}</li>)}</ul>}
    </GamePanel>

    <ActionBar sticky className="mt-6">{count.source === "PAPER_OCR" && <Link className="game-button game-button--secondary game-button--lg" href={`/inventory/count/paper`}>พิมพ์ใบนับใหม่</Link>}<GameButton size="lg" disabled={count.countStatus === "COMPLETED" || complete.isPending || !isCountCompletable(count)} onClick={() => complete.mutate()}>{count.countStatus === "COMPLETED" ? "Completed แล้ว" : "ยืนยันผลนับ"}</GameButton></ActionBar>
  </div>;
}

function Meta({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return <div><p className="text-xs font-black text-[var(--color-game-muted)]">{label}</p>{badge ? <StatusBadge className="mt-1" tone={value.includes("COMPLETED") || value.includes("CONFIRMED") ? "success" : value.includes("REVIEW") || value.includes("DRAFT") ? "warning" : "neutral"}>{value}</StatusBadge> : <p className="mt-1 font-black text-[var(--color-game-brown)]">{value}</p>}</div>;
}
