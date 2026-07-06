import { describe, expect, it } from "vitest";
import { getItemImageInputError, getItemPlaceholderText, isValidItemImageInput, normalizeImageUrl, shouldShowItemImage } from "./image-url";

describe("normalizeImageUrl", () => {
  it("trims and normalizes local item paths", () => expect(normalizeImageUrl(" images/items/red-pork.webp ")).toBe("/images/items/red-pork.webp"));
  it("supports HTTPS png, jpg and jpeg URLs", () => {
    expect(normalizeImageUrl("https://cdn.example.test/a.png")).toBe("https://cdn.example.test/a.png");
    expect(normalizeImageUrl("https://cdn.example.test/a.JPG")).toBe("https://cdn.example.test/a.JPG");
    expect(normalizeImageUrl("https://cdn.example.test/a.jpeg")).toBe("https://cdn.example.test/a.jpeg");
  });
  it("rejects unsupported and insecure URLs", () => {
    expect(normalizeImageUrl("http://example.test/a.webp")).toBe("");
    expect(normalizeImageUrl("/images/items/a.svg")).toBe("");
  });
  it("validates form input rules for local and HTTPS images", () => {
    expect(isValidItemImageInput("/images/items/red-pork.webp")).toBe(true);
    expect(isValidItemImageInput("https://cdn.example.test/red-pork.webp")).toBe(true);
    expect(isValidItemImageInput("images/items/red-pork.webp")).toBe(false);
    expect(isValidItemImageInput("http://cdn.example.test/red-pork.webp")).toBe(false);
  });
  it.each([
    "C:\\Users\\ASUS\\Downloads\\image.png",
    "file:///Users/demo/image.png",
    '"/images/items/image.png"',
    "'https://cdn.example.test/image.png'",
  ])("rejects a local or quoted path with upload guidance: %s", (value) => {
    expect(getItemImageInputError(value)).toBe("ไม่สามารถใช้ path จากเครื่องได้ กรุณากดเลือกรูปจากเครื่อง");
  });
  it("returns a stable Thai placeholder without combining marks", () => {
    expect(getItemPlaceholderText("หมูแดง")).toBe("ม");
    expect(getItemPlaceholderText("หมูกรอบ")).toBe("ม");
    expect(getItemPlaceholderText(" ข้าว ")).toBe("ข");
  });
  it("falls back for empty sources and image load errors", () => {
    expect(shouldShowItemImage("", false)).toBe(false);
    expect(shouldShowItemImage("/images/items/a.webp", true)).toBe(false);
  });
});
