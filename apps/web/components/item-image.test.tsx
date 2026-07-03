import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ItemImage } from "./item-image";

describe("ItemImage", () => {
  it("renders a padded, centered placeholder tile", () => {
    const markup = renderToStaticMarkup(<ItemImage itemName="หมูแดง" />);
    expect(markup).toContain("data-testid=\"item-placeholder\"");
    expect(markup).toContain("place-items-center");
    expect(markup).toContain("min-h-22");
    expect(markup).toContain("p-4");
    expect(markup).toContain("leading-none");
    expect(markup).toContain(">ม<");
  });

  it("renders a normalized image without a broken-image placeholder", () => {
    const markup = renderToStaticMarkup(<ItemImage src=" images/items/red-pork.webp " itemName="หมูแดง" />);
    expect(markup).toContain("src=\"/images/items/red-pork.webp\"");
    expect(markup).not.toContain("item-placeholder");
  });
});
