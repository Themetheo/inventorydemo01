import "dotenv/config";
import { createSheetsClient } from "../src/plugins/google-sheets.js";
import { SHEET_HEADERS } from "../src/models.js";

const tabs = ["Stock_Counts", "Stock_Count_Items"] as const;

try {
  const { sheets, spreadsheetId } = createSheetsClient();
  for (const tab of tabs) {
    const expected = SHEET_HEADERS[tab];
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!1:1`,
    });
    const current = ((response.data.values?.[0] ?? []) as string[]).map((value) => String(value ?? "").trim());
    const missing = expected.filter((header) => !current.includes(header));
    if (!missing.length) {
      console.log(`✓ ${tab}: headers already complete`);
      continue;
    }
    const merged = [...current, ...missing];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1:${columnName(merged.length)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [merged] },
    });
    console.log(`✓ ${tab}: added ${missing.join(", ")}`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`✗ Failed to ensure stock count OCR columns: ${message}`);
  process.exitCode = 1;
}

function columnName(count: number): string {
  let value = count;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}
