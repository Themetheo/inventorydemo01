import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => fsMocks);

import { POST, sanitizeItemId } from "./route";

const signatures = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
} as const;

function uploadRequest(type: keyof typeof signatures, name: string, itemId = "SUP-TISSUE-001", size?: number) {
  const bytes = new Uint8Array(size ?? signatures[type].length);
  bytes.set(signatures[type]);
  const formData = new FormData();
  formData.append("file", new File([bytes], name, { type }));
  formData.append("itemId", itemId);
  return new Request("http://localhost/api/uploads/items", { method: "POST", body: formData });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/uploads/items", () => {
  it.each([
    ["PNG", "image/png", "png"],
    ["JPG", "image/jpeg", "jpg"],
    ["WebP", "image/webp", "webp"],
  ] as const)("uploads a valid %s with a generated safe filename", async (_label, type, extension) => {
    const response = await POST(uploadRequest(type, "../../untrusted-name.exe"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.imageUrl).toMatch(new RegExp(`^/images/items/SUP-TISSUE-001-\\d+-[a-f0-9]{12}\\.${extension}$`));
    expect(body.data.imageUrl).not.toContain("untrusted-name");
    expect(fsMocks.mkdir).toHaveBeenCalledWith(expect.stringContaining("/public/images/items"), { recursive: true });
    expect(fsMocks.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`/public/images/items/SUP-TISSUE-001-\\d+-[a-f0-9]{12}\\.${extension}$`)),
      expect.any(Uint8Array),
      { flag: "wx" },
    );
  });

  it("uses new-item when an item has not been created yet", async () => {
    const response = await POST(uploadRequest("image/png", "item.png", ""));
    const body = await response.json();
    expect(body.data.imageUrl).toMatch(/^\/images\/items\/new-item-\d+-[a-f0-9]{12}\.png$/);
  });

  it("rejects a file larger than 500 KB", async () => {
    const response = await POST(uploadRequest("image/png", "large.png", "ITEM-1", 500 * 1024 + 1));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: "IMAGE_TOO_LARGE", message: "รูปต้องมีขนาดไม่เกิน 500 KB" },
    });
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });

  it("rejects a non-image file", async () => {
    const formData = new FormData();
    formData.append("file", new File(["plain text"], "notes.txt", { type: "text/plain" }));
    const response = await POST(new Request("http://localhost/api/uploads/items", { method: "POST", body: formData }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNSUPPORTED_IMAGE_TYPE", message: "รองรับเฉพาะไฟล์ WebP, PNG และ JPG" },
    });
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });

  it("rejects spoofed image MIME data", async () => {
    const formData = new FormData();
    formData.append("file", new File(["not a png"], "fake.png", { type: "image/png" }));
    const response = await POST(new Request("http://localhost/api/uploads/items", { method: "POST", body: formData }));
    expect(response.status).toBe(400);
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });
});

describe("sanitizeItemId", () => {
  it("removes traversal and unsafe filename characters", () => {
    expect(sanitizeItemId("../../SUP TISSUE/001")).toBe("SUP-TISSUE-001");
  });
});
