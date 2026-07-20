import { displayCountNumber, formatThaiDate, formatThaiFullDate } from "@/components/documents/document-formatters";
import { DocumentFooter } from "@/components/documents/document-footer";
import { DocumentHeader } from "@/components/documents/document-header";
import { DocumentMeta } from "@/components/documents/document-meta";
import { DocumentPaper } from "@/components/documents/document-page";
import { DocumentSignatures } from "@/components/documents/document-signatures";
import { StockCountDocumentTable } from "@/components/documents/stock-count-document-table";
import { PAPER_ROWS_PER_FINAL_PAGE, PAPER_ROWS_PER_PAGE } from "@/lib/stock-count-paper";
import type { StockCount } from "@/lib/types";

export const stockCountRounds = ["OPENING", "MIDDAY", "CLOSING", "ADHOC"] as const;

export function StockCountPrintableDocument({
  count,
  pages,
  className = "",
  normalMinRows = PAPER_ROWS_PER_PAGE,
  finalMinRows = PAPER_ROWS_PER_FINAL_PAGE,
  officialCopy = false,
}: {
  count: StockCount;
  pages: NonNullable<StockCount["items"]>[];
  className?: string;
  normalMinRows?: number;
  finalMinRows?: number;
  officialCopy?: boolean;
}) {
  const documentNumber = displayCountNumber(count);
  const documentDate = officialCopy ? formatThaiFullDate(count.countDate || count.createdAt) : formatThaiDate(count.countDate || count.createdAt);
  const title = officialCopy ? "ใบตรวจนับสินค้าคงคลัง" : "ใบเช็คสต๊อก";
  const brandSubtitle = "ระบบบริหารจัดการร้านข้าวหมูแดงเรือเมล์";
  const documentSubtitle = officialCopy ? "Stock Count Sheet" : undefined;
  return (
    <div className={`document-system stock-count-document-system print-root ${className}`}>
      <div className="document-sheet mx-auto bg-white">
        {pages.map((pageItems, pageIndex) => {
          const isFinalPage = pageIndex === pages.length - 1;
          const useFinalCompactLayout = officialCopy && isFinalPage && pageItems.length > finalMinRows;
          return (
          <DocumentPaper key={pageIndex} className={`print-page ${isFinalPage ? "document-paper--final-page" : "document-paper--page-break"}`}>
            <div className="stock-count-watermark" aria-hidden="true">ร้านข้าวหมูแดงเรือเมล์</div>
            <DocumentHeader title={title} documentNumber={documentNumber} subtitle={brandSubtitle} documentSubtitle={documentSubtitle} />
            <DocumentMeta
              className="document-meta--compact document-meta--stock-count"
              items={[
                { label: officialCopy ? "วันที่ตรวจนับ" : "วันที่จัดทำ", value: documentDate },
                { label: "รอบนับ", value: roundLabel(count.countRound as typeof stockCountRounds[number]) },
                { label: officialCopy ? "พื้นที่ตรวจนับ" : "ตำแหน่งจัดเก็บ", value: count.location?.locationName || count.locationId },
                { label: "หน้า", value: officialCopy ? `${pageIndex + 1} / ${pages.length}` : `${pageIndex + 1}/${pages.length}` },
              ]}
            />
            <div className={`document-content ${useFinalCompactLayout ? "stock-count-final-compact" : ""}`}>
              <StockCountDocumentTable
                items={pageItems}
                minRows={isFinalPage ? (useFinalCompactLayout ? pageItems.length : finalMinRows) : normalMinRows}
                normalizeUnits={officialCopy}
                showEndRow={officialCopy && isFinalPage && (!useFinalCompactLayout || pageItems.length < normalMinRows)}
              />
            </div>
            {isFinalPage ? (
              <div className="stock-count-final-bottom">
                <section className="final-section">
                  <DocumentFooter note={count.note || ""} emptyLabel="" />
                  <DocumentSignatures emptyName={officialCopy ? "__________________________" : ""} showTime={officialCopy} namedRoleLayout={officialCopy} slots={[
                    { label: "ผู้ตรวจนับ", name: "" },
                    { label: "ผู้ตรวจสอบ", name: "" },
                    { label: "ผู้อนุมัติ", name: "" },
                  ]} />
                </section>
                <div className="stock-count-page-footer">หน้า {officialCopy ? `${pageIndex + 1} / ${pages.length}` : `${pageIndex + 1}/${pages.length}`}</div>
              </div>
            ) : (
              <div className="stock-count-page-footer">หน้า {officialCopy ? `${pageIndex + 1} / ${pages.length}` : `${pageIndex + 1}/${pages.length}`}</div>
            )}
          </DocumentPaper>
        );
        })}
      </div>
    </div>
  );
}

export function roundLabel(round: typeof stockCountRounds[number]) {
  return ({ OPENING: "เปิดร้าน", MIDDAY: "กลางวัน", CLOSING: "ปิดร้าน", ADHOC: "นับพิเศษ" } as const)[round] ?? round;
}
