import type { StockCount, StockCountItem } from "./types";

export const PAPER_ROWS_PER_PAGE = 14;
export const PAPER_ROWS_PER_FINAL_PAGE = 10;
export const STOCK_COUNT_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const STOCK_COUNT_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const PREVIEW_PAGE_HEIGHT_PX = 1123;
export const PREVIEW_CANVAS_PADDING_PX = 96;

export function getPreviewCanvasHeight(pageCount: number) {
  return PREVIEW_PAGE_HEIGHT_PX * Math.max(pageCount, 1) + PREVIEW_CANVAS_PADDING_PX;
}

export function paginateCountItems(items: StockCountItem[], rowsPerPage = PAPER_ROWS_PER_PAGE): StockCountItem[][] {
  if (rowsPerPage < 1) throw new Error("rowsPerPage must be positive");
  const pages: StockCountItem[][] = [];
  for (let index = 0; index < items.length; index += rowsPerPage) pages.push(items.slice(index, index + rowsPerPage));
  return pages.length ? pages : [[]];
}

export function paginateCountItemsForPrint(items: StockCountItem[], rowsPerNormalPage = PAPER_ROWS_PER_PAGE, rowsPerFinalPage = PAPER_ROWS_PER_FINAL_PAGE): StockCountItem[][] {
  if (rowsPerNormalPage < 1 || rowsPerFinalPage < 1) throw new Error("rows per page must be positive");
  if (!items.length) return [[]];
  if (items.length <= rowsPerFinalPage) return [items];

  const pages: StockCountItem[][] = [];
  let index = 0;

  while (items.length - index > rowsPerNormalPage) {
    pages.push(items.slice(index, index + rowsPerNormalPage));
    index += rowsPerNormalPage;
  }

  pages.push(items.slice(index));
  return pages;
}

export function formatThaiShortDate(value: string): string {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return [date.getDate(), date.getMonth() + 1, (date.getFullYear() + 543) % 100].map((part) => String(part).padStart(2, "0")).join("/");
}

export function countReviewSummary(items: StockCountItem[]) {
  return {
    total: items.length,
    recognized: items.filter((item) => item.reviewStatus === "OCR_RECOGNIZED" || item.reviewStatus === "CONFIRMED").length,
    needsReview: items.filter((item) => item.reviewStatus === "NEEDS_REVIEW").length,
    unread: items.filter((item) => item.reviewStatus === "UNREAD" || item.countedQty === null).length,
    edited: items.filter((item) => item.reviewedQty !== null && item.ocrRawValue !== "" && Number(item.ocrRawValue) !== item.reviewedQty).length,
    confirmed: items.filter((item) => item.reviewStatus === "CONFIRMED" && item.countedQty !== null).length,
  };
}

export function isCountCompletable(count: Pick<StockCount, "items">): boolean {
  const items = count.items ?? [];
  return items.length > 0 && items.every((item) => item.reviewStatus === "CONFIRMED" && item.countedQty !== null && item.countedQty >= 0);
}

export function validateStockCountUpload(file: Pick<File, "name" | "type" | "size">, existingFingerprints: Set<string>) {
  const fingerprint = `${file.name}:${file.size}`;
  if (existingFingerprints.has(fingerprint)) return { ok: false as const, code: "DUPLICATE_UPLOAD", message: "ไฟล์นี้ถูกเลือกแล้ว" };
  if (!STOCK_COUNT_UPLOAD_MIME_TYPES.includes(file.type as typeof STOCK_COUNT_UPLOAD_MIME_TYPES[number])) return { ok: false as const, code: "INVALID_TYPE", message: "รองรับเฉพาะ JPG, PNG, WebP หรือ PDF" };
  if (file.size <= 0 || file.size > STOCK_COUNT_UPLOAD_MAX_BYTES) return { ok: false as const, code: "INVALID_SIZE", message: "ไฟล์ต้องมีขนาดไม่เกิน 25 MB" };
  return { ok: true as const, fingerprint };
}
