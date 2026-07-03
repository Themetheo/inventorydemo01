import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StockCountCard } from "./stock-count-card";

describe("StockCountCard", () => {
  it("renders a large count control without row dropdowns or tables", () => {
    const markup = renderToStaticMarkup(<StockCountCard item={{ itemId: "I1", itemName: "ข้าว", categoryId: "C1", unit: "kg", imageUrl: "", description: "", isActive: true, createdAt: "" }} systemQty={5} countedQty={4} note="" onCountedQtyChange={() => undefined} onNoteChange={() => undefined} />);
    expect(markup).toContain("ข้าว");
    expect(markup).toContain("ระบบ 5 kg");
    expect(markup).toContain("ต่าง -1");
    expect(markup).toContain("aria-label=\"จำนวนจริง ข้าว\"");
    expect(markup).not.toContain("<select");
    expect(markup).not.toContain("<table");
  });
});
