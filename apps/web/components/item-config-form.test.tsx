import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { applyUploadedItemImage, formatImageFileSize } from "../lib/item-image-upload";
import { ItemImage } from "./item-image";

describe("item image upload form flow", () => {
  it("puts the uploaded image URL into React Hook Form with validation flags", () => {
    const setValue = vi.fn();
    applyUploadedItemImage(setValue, { imageUrl: "/images/items/SUP-TISSUE-001-123-a1b2c3.png" });
    expect(setValue).toHaveBeenCalledWith("imageUrl", "/images/items/SUP-TISSUE-001-123-a1b2c3.png", {
      shouldDirty: true,
      shouldValidate: true,
    });
  });

  it("updates the ItemImage preview and keeps the URL when the saved item is reopened", () => {
    const formValue = { imageUrl: "/images/items/SUP-TISSUE-001-123-a1b2c3.png" };
    const savedAndReloaded = JSON.parse(JSON.stringify({ itemName: "กระดาษทิชชู่", ...formValue })) as { itemName: string; imageUrl: string };
    const markup = renderToStaticMarkup(<ItemImage src={savedAndReloaded.imageUrl} itemName={savedAndReloaded.itemName} />);
    expect(markup).toContain('src="/images/items/SUP-TISSUE-001-123-a1b2c3.png"');
    expect(markup).not.toContain("item-placeholder");
  });

  it("formats the selected file size for display", () => {
    expect(formatImageFileSize(12 * 1024)).toBe("12 KB");
    expect(formatImageFileSize(622 * 1024)).toBe("622 KB");
    expect(formatImageFileSize(184 * 1024)).toBe("184 KB");
  });
});
