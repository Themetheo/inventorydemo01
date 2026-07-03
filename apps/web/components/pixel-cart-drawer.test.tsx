import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PixelCartDrawer } from "./pixel-cart-drawer";

describe("PixelCartDrawer", () => {
  it("covers the viewport and keeps only its body scrollable", () => {
    const markup = renderToStaticMarkup(<PixelCartDrawer onClose={() => undefined} footer={<button>ส่งคำขอ</button>}><div>รายการสินค้า</div></PixelCartDrawer>);

    expect(markup).toContain("fixed inset-0 z-[60] overflow-hidden");
    expect(markup).toContain("absolute inset-0 z-0");
    expect(markup).toContain("absolute inset-y-0 right-0 z-10");
    expect(markup).toContain("h-[100dvh] w-full max-w-[480px]");
    expect(markup).toContain("min-h-0 flex-1 overflow-y-auto");
    expect(markup).toContain("shrink-0 border-t-2");
  });
});
