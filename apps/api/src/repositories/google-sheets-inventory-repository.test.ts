import type { sheets_v4 } from "googleapis";
import { describe, expect, it, vi } from "vitest";
import { GoogleSheetsInventoryRepository } from "./google-sheets-inventory-repository.js";

describe("GoogleSheetsInventoryRepository Items", () => {
  it("returns only rows containing both Item_ID and Item_Name", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        values: [
          ["Item_ID", "Item_Name", "Category_ID", "Unit", "Image_URL", "Description", "Is_Active", "Created_At"],
          [],
          ["", "", "", "", "", "", "FALSE", ""],
          ["I-NAMELESS", "", "C1", "ชิ้น", "", "", "FALSE", ""],
          ["", "มีชื่ออย่างเดียว", "C1", "ชิ้น", "", "", "TRUE", ""],
          ["I1", "ข้าว", "C1", "kg", "/images/items/rice.webp", "", "TRUE", "now"],
        ],
      },
    });
    const sheets = { spreadsheets: { values: { get } } } as unknown as sheets_v4.Sheets;
    const repository = new GoogleSheetsInventoryRepository(sheets, "sheet-id");

    const records = await repository.read("Items");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      Item_ID: "I1",
      Item_Name: "ข้าว",
      Category_ID: "C1",
      Image_URL: "/images/items/rice.webp",
      Is_Active: "TRUE",
    });
  });
});
