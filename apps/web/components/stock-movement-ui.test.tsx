import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MovementProductCard, MovementTypePicker, QuantityStepper } from "./stock-movement-ui";

describe("stock movement game UI", () => {
  it("renders movement choices as buttons with the original enum values", () => {
    const markup = renderToStaticMarkup(<MovementTypePicker value="RECEIVE" onChange={() => undefined} onCount={() => undefined} />);
    expect(markup).toContain("รับของเข้า");
    expect(markup).toContain("เบิกไปใช้");
    expect(markup).toContain("นับสต๊อก");
    expect(markup).not.toContain("<select");
  });

  it("selects a real item with a non-submit button", () => {
    const markup = renderToStaticMarkup(<MovementProductCard balance={8} item={{ itemId: "I1", itemName: "ข้าว", categoryId: "C1", unit: "kg", imageUrl: "", description: "", isActive: true, createdAt: "" }} onSelect={() => undefined} />);
    expect(markup).toContain("data-item-id=\"I1\"");
    expect(markup).toContain("type=\"button\"");
    expect(markup).toContain("คงเหลือ 8 kg");
  });

  it("renders large quantity controls without submitting", () => {
    const markup = renderToStaticMarkup(<QuantityStepper value={1} unit="kg" onChange={() => undefined} />);
    expect(markup.match(/type=\"button\"/g)).toHaveLength(4);
    expect(markup).toContain("-10");
    expect(markup).toContain("+10");
    expect(markup).toContain("min-h-12");
  });
});
