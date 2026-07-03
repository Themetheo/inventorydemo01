import { describe, expect, it } from "vitest";
import { assertHeaders, filterValidItemRecords, rowsToRecords } from "./sheets.js";

describe("Google Sheets headers", () => {
  it("accepts header whitespace after trimming", () => expect(() => assertHeaders("Stock_Requests", ["Request_ID", "Request_Date"], [" Request_ID ", "Request_Date "])).not.toThrow());
  it("reports the exact missing tab header", () => expect(() => assertHeaders("Stock_Request_Items", ["Requested_Qty"], ["Item_ID"])).toThrow("ตาราง Stock_Request_Items ไม่มีคอลัมน์ Requested_Qty"));
  it("maps records with normalized headers", () => expect(rowsToRecords(["Request_ID"], [[" REQ-1 "]])).toEqual([{ Request_ID: "REQ-1" }]));
});

describe("item record filtering", () => {
  it("drops a row containing only Is_Active=FALSE", () => {
    expect(filterValidItemRecords([{ Item_ID: "", Item_Name: "", Is_Active: "FALSE" }])).toEqual([]);
  });

  it("does not turn a fully blank row into an item", () => {
    const records = rowsToRecords(["Item_ID", "Item_Name", "Is_Active"], [["", "", ""]]);
    expect(filterValidItemRecords(records)).toEqual([]);
  });

  it("drops a row with Item_ID but no Item_Name", () => {
    expect(filterValidItemRecords([{ Item_ID: "I2", Item_Name: "", Is_Active: "TRUE" }])).toEqual([]);
  });

  it("drops a row with Item_Name but no Item_ID", () => {
    expect(filterValidItemRecords([{ Item_ID: "", Item_Name: "หมูแดง", Is_Active: "TRUE" }])).toEqual([]);
  });

  it("keeps a real item row", () => {
    const records = filterValidItemRecords([{ Item_ID: " I1 ", Item_Name: " หมูแดง ", Is_Active: "TRUE" }]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ Item_ID: " I1 ", Item_Name: " หมูแดง " });
  });
});
