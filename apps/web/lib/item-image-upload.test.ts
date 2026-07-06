import { describe, expect, it, vi } from "vitest";
import { compressItemImage, compressedWebpFilename, containedImageDimensions, type ItemImageProcessor } from "./item-image-upload";

function webp(size: number) {
  return new Blob([new Uint8Array(size)], { type: "image/webp" });
}

function sourceFile(size = 622 * 1024) {
  return new File([new Uint8Array(size)], "product photo.JPG", { type: "image/jpeg" });
}

function processor(width: number, height: number, encode: ItemImageProcessor["encode"]): ItemImageProcessor {
  return { width, height, encode, dispose: vi.fn() };
}

describe("containedImageDimensions", () => {
  it("fits large images inside 800 x 600 while preserving aspect ratio", () => {
    expect(containedImageDimensions(1600, 900)).toEqual({ width: 800, height: 450 });
    expect(containedImageDimensions(1600, 1200)).toEqual({ width: 800, height: 600 });
  });

  it("does not upscale smaller images", () => {
    expect(containedImageDimensions(400, 300)).toEqual({ width: 400, height: 300 });
  });
});

describe("compressItemImage", () => {
  it("converts the image to a WebP file and reports final dimensions and sizes", async () => {
    const encode = vi.fn().mockResolvedValue(webp(184 * 1024));
    const result = await compressItemImage(sourceFile(), async () => processor(1600, 900, encode));

    expect(encode).toHaveBeenCalledWith(800, 450, 0.82);
    expect(result.file.name).toBe("product-photo.webp");
    expect(result.file.type).toBe("image/webp");
    expect(result.originalSize).toBe(622 * 1024);
    expect(result.compressedSize).toBe(184 * 1024);
    expect({ width: result.width, height: result.height }).toEqual({ width: 800, height: 450 });
  });

  it("reduces quality by 0.08 without going below 0.55", async () => {
    const encode = vi.fn()
      .mockResolvedValueOnce(webp(700 * 1024))
      .mockResolvedValueOnce(webp(650 * 1024))
      .mockResolvedValueOnce(webp(600 * 1024))
      .mockResolvedValueOnce(webp(550 * 1024))
      .mockResolvedValueOnce(webp(480 * 1024));

    await compressItemImage(sourceFile(), async () => processor(800, 600, encode));
    expect(encode.mock.calls.map((call) => call[2])).toEqual([0.82, 0.74, 0.66, 0.58, 0.55]);
  });

  it("reduces width and height by 10 percent after exhausting quality", async () => {
    const encode = vi.fn()
      .mockResolvedValueOnce(webp(700 * 1024))
      .mockResolvedValueOnce(webp(680 * 1024))
      .mockResolvedValueOnce(webp(650 * 1024))
      .mockResolvedValueOnce(webp(620 * 1024))
      .mockResolvedValueOnce(webp(590 * 1024))
      .mockResolvedValueOnce(webp(490 * 1024));

    const result = await compressItemImage(sourceFile(), async () => processor(1200, 900, encode));
    expect(encode).toHaveBeenLastCalledWith(720, 540, 0.55);
    expect({ width: result.width, height: result.height }).toEqual({ width: 720, height: 540 });
  });
});

describe("compressedWebpFilename", () => {
  it("replaces the original extension with webp", () => {
    expect(compressedWebpFilename("สินค้า.jpeg")).toBe("item-image.webp");
    expect(compressedWebpFilename("product.PNG")).toBe("product.webp");
  });
});
