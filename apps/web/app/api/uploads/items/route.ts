import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 500 * 1024;
const FILE_TYPES = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
} as const;

type SupportedMimeType = keyof typeof FILE_TYPES;

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function sanitizeItemId(value: FormDataEntryValue | null): string {
  const input = typeof value === "string" ? value : "new-item";
  const sanitized = input
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 64);
  return sanitized || "new-item";
}

function hasExpectedSignature(bytes: Uint8Array, type: SupportedMimeType): boolean {
  if (type === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !(file.type in FILE_TYPES)) {
      return errorResponse("UNSUPPORTED_IMAGE_TYPE", "รองรับเฉพาะไฟล์ WebP, PNG และ JPG");
    }
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("IMAGE_TOO_LARGE", "รูปต้องมีขนาดไม่เกิน 500 KB");
    }

    const type = file.type as SupportedMimeType;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedSignature(bytes, type)) {
      return errorResponse("UNSUPPORTED_IMAGE_TYPE", "รองรับเฉพาะไฟล์ WebP, PNG และ JPG");
    }

    const itemId = sanitizeItemId(formData.get("itemId"));
    const extension = FILE_TYPES[type];
    const filename = `${itemId}-${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
    const uploadDirectory = path.resolve(process.cwd(), "public", "images", "items");
    const targetPath = path.resolve(uploadDirectory, filename);
    if (!targetPath.startsWith(`${uploadDirectory}${path.sep}`)) {
      return errorResponse("INVALID_UPLOAD_PATH", "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่", 500);
    }

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(targetPath, bytes, { flag: "wx" });

    return NextResponse.json({
      data: { imageUrl: `/images/items/${filename}` },
    });
  } catch (error) {
    console.error("[item-upload] Upload failed", {
      classification: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("UPLOAD_FAILED", "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่", 500);
  }
}
