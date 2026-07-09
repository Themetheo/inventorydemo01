import { describe, expect, it } from "vitest";
import { countReviewSummary, formatThaiShortDate, isCountCompletable, paginateCountItems, paginateCountItemsForPrint, validateStockCountUpload } from "./stock-count-paper";
import type { StockCountItem } from "./types";

const item = (rowNumber: number, status: StockCountItem["reviewStatus"], countedQty: number | null, extra: Partial<StockCountItem> = {}): StockCountItem => ({
  countItemId: `CI${rowNumber}`,
  countId: "CNT1",
  itemId: `I${rowNumber}`,
  systemQty: 5,
  countedQty,
  varianceQty: countedQty === null ? 0 : countedQty - 5,
  unit: "kg",
  note: "",
  rowNumber,
  ocrRawValue: countedQty === null ? "" : String(countedQty),
  ocrConfidence: status === "NEEDS_REVIEW" ? 0.5 : 0.9,
  reviewStatus: status,
  reviewedQty: countedQty,
  ...extra,
});

describe("stock count paper helpers", () => {
  it("splits count rows into A4 pages without cutting rows", () => {
    const rows = Array.from({ length: 37 }, (_, index) => item(index + 1, "UNREAD", null));
    const pages = paginateCountItems(rows, 18);
    expect(pages.map((page) => page.length)).toEqual([18, 18, 1]);
    expect(pages[1][0].rowNumber).toBe(19);
  });

  it("reserves final-page space for paper notes and signatures", () => {
    const rows = Array.from({ length: 70 }, (_, index) => item(index + 1, "UNREAD", null));
    const pages = paginateCountItemsForPrint(rows, 18, 16);
    expect(pages.map((page) => page.length)).toEqual([18, 18, 18, 16]);
    expect(pages.at(-1)?.at(0)?.rowNumber).toBe(55);
  });

  it("formats short Thai Buddhist dates for printed forms", () => {
    expect(formatThaiShortDate("2026-07-08")).toBe("08/07/69");
  });

  it("summarizes OCR recognized, low confidence, unread, and user edited rows", () => {
    const summary = countReviewSummary([
      item(1, "OCR_RECOGNIZED", 1.5),
      item(2, "NEEDS_REVIEW", 2),
      item(3, "UNREAD", null),
      item(4, "CONFIRMED", 4, { ocrRawValue: "3", reviewedQty: 4 }),
    ]);
    expect(summary).toMatchObject({ total: 4, recognized: 2, needsReview: 1, unread: 1, edited: 1 });
  });

  it("allows completion only after every row is confirmed with a non-negative quantity", () => {
    expect(isCountCompletable({ items: [item(1, "CONFIRMED", 0), item(2, "CONFIRMED", 2.5)] })).toBe(true);
    expect(isCountCompletable({ items: [item(1, "CONFIRMED", 0), item(2, "NEEDS_REVIEW", 2)] })).toBe(false);
    expect(isCountCompletable({ items: [item(1, "CONFIRMED", null)] })).toBe(false);
  });

  it("rejects duplicate and unsupported upload files", () => {
    const seen = new Set<string>();
    const first = validateStockCountUpload({ name: "scan.jpg", type: "image/jpeg", size: 1000 } as File, seen);
    expect(first.ok).toBe(true);
    if (first.ok) seen.add(first.fingerprint);
    expect(validateStockCountUpload({ name: "scan.jpg", type: "image/jpeg", size: 1000 } as File, seen)).toMatchObject({ ok: false, code: "DUPLICATE_UPLOAD" });
    expect(validateStockCountUpload({ name: "scan.txt", type: "text/plain", size: 1000 } as File, new Set())).toMatchObject({ ok: false, code: "INVALID_TYPE" });
  });
});
