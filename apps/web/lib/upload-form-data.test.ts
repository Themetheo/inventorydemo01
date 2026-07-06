import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadFormData } from "./upload-form-data";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadFormData", () => {
  it("posts multipart form data without overriding the browser content type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      data: { imageUrl: "/images/items/new-item-123-a1b2c3.webp" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const formData = new FormData();
    formData.append("file", new Blob(["image"]), "item.webp");

    await expect(uploadFormData<{ imageUrl: string }>("/api/uploads/items", formData)).resolves.toEqual({
      imageUrl: "/images/items/new-item-123-a1b2c3.webp",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/uploads/items", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toBeUndefined();
  });
});
