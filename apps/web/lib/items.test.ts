import { describe, expect, it } from "vitest";
import { filterValidItems } from "./items";

describe("frontend item filtering", () => {
  it("renders one card for each real item without synthesizing fallback IDs", () => {
    const items = [
      { itemId: "", itemName: "" },
      { itemId: "", itemName: "มีชื่ออย่างเดียว" },
      { itemId: "I-NAMELESS", itemName: "" },
      { itemId: " I1 ", itemName: " ข้าว " },
      { itemId: "I2", itemName: "น้ำ" },
    ];

    const validItems = filterValidItems(items);

    expect(validItems).toHaveLength(2);
    expect(validItems.map((item) => item.itemId.trim())).toEqual(["I1", "I2"]);
  });
});
