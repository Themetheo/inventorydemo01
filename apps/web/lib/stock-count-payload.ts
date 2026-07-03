export type StockCountFormValue = {
  locationId: string;
  countRound: "OPENING" | "MIDDAY" | "CLOSING" | "ADHOC";
  note: string;
  items: Array<{ itemId: string; itemName: string; countedQty: number; systemQty: number; unit: string; note: string }>;
};

export function buildStockCountPayload(values: StockCountFormValue, status: "DRAFT" | "COMPLETED") {
  return {
    locationId: values.locationId,
    countRound: values.countRound,
    status,
    note: values.note,
    items: values.items.map((value) => ({ itemId: value.itemId, countedQty: value.countedQty, unit: value.unit, note: value.note })),
  };
}
