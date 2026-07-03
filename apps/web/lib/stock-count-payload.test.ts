import { describe, expect, it } from "vitest";
import { buildStockCountPayload } from "./stock-count-payload";

describe("stock count payload", () => {
  it("keeps every counted item in the existing API shape", () => {
    const payload = buildStockCountPayload({ locationId: "L1", countRound: "CLOSING", note: "ปิดร้าน", items: [
      { itemId: "I1", itemName: "ข้าว", systemQty: 5, countedQty: 4, unit: "kg", note: "ขาด" },
      { itemId: "I2", itemName: "น้ำ", systemQty: 2, countedQty: 0, unit: "ขวด", note: "หมด" },
    ] }, "COMPLETED");

    expect(payload.items).toEqual([
      { itemId: "I1", countedQty: 4, unit: "kg", note: "ขาด" },
      { itemId: "I2", countedQty: 0, unit: "ขวด", note: "หมด" },
    ]);
    expect(payload.status).toBe("COMPLETED");
  });
});
