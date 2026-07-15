import type { StockCountItem } from "@/lib/types";

function displayUnit(unit: string | undefined, normalizeUnits: boolean) {
  if (!unit || !normalizeUnits) return unit ?? "";
  const normalized = unit.trim().toLowerCase();
  const unitMap: Record<string, string> = {
    kg: "กก.",
    kgs: "กก.",
    kilogram: "กก.",
    kilograms: "กก.",
    oz: "ออนซ์",
    ounce: "ออนซ์",
    ounces: "ออนซ์",
  };
  return unitMap[normalized] ?? unit;
}

export function StockCountDocumentTable({
  items,
  minRows = 10,
  normalizeUnits = false,
  showEndRow = false,
}: {
  items: StockCountItem[];
  minRows?: number;
  normalizeUnits?: boolean;
  showEndRow?: boolean;
}) {
  if (!items.length) {
    return <div className="document-empty-items">ไม่มีรายการสินค้า</div>;
  }

  const rows: Array<StockCountItem | null> = showEndRow
    ? items
    : [...items, ...Array.from({ length: Math.max(0, minRows - items.length) }, () => null)];

  return (
    <div className="document-table-wrap">
      <table className="document-table document-table--stock-count count-table">
        <colgroup>
          <col className="document-table__col-index col-index" />
          <col className="document-table__col-code col-code" />
          <col className="document-table__col-count-name col-name" />
          <col className="document-table__col-unit col-unit" />
          <col className="document-table__col-count-write col-count" />
          <col className="document-table__col-count-note col-note" />
        </colgroup>
        <thead>
          <tr>
            <th className="document-table__center document-table__index">ลำดับ</th>
            <th className="document-table__center">รหัสสินค้า</th>
            <th>ชื่อรายการ</th>
            <th className="document-table__center">หน่วย</th>
            <th className="document-table__center">จำนวนที่นับได้</th>
            <th>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr className={item ? undefined : "document-table__empty-row"} key={item?.countItemId || (item ? `${item.itemId}-${item.rowNumber}` : `empty-row-${index}`)}>
              <td className="document-table__center">{item?.rowNumber ?? ""}</td>
              <td className="document-table__item-code code-cell">{item?.itemId ?? ""}</td>
              <td className="document-table__name name-cell">
                {item && <span className="document-table__item-name">{item.item?.itemName || item.itemId || "ไม่พบชื่อสินค้า"}</span>}
              </td>
              <td className="document-table__center">{displayUnit(item?.unit, normalizeUnits)}</td>
              <td className="document-table__count-write-cell" aria-label={item ? `จำนวนที่นับได้ ${item.item?.itemName ?? item.itemId}` : undefined} />
              <td className="document-table__note" />
            </tr>
          ))}
          {showEndRow && (
            <tr className="document-table__end-row">
              <td colSpan={6}>— สิ้นสุดรายการ —</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
