import { ApiError } from "./api";

function safeUploadError(details: Record<string, unknown>) {
  console.error("[item-upload] Request failed", details);
}

export async function uploadFormData<T>(path: string, formData: FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  } catch (cause) {
    safeUploadError({ classification: "NETWORK_ERROR", causeName: cause instanceof Error ? cause.name : "UnknownError" });
    throw new ApiError("NETWORK_ERROR", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่", 0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const rawError = typeof body === "object" && body && "error" in body ? (body as { error?: unknown }).error : undefined;
    const code = typeof rawError === "object" && rawError && "code" in rawError && typeof rawError.code === "string"
      ? rawError.code
      : "UPLOAD_FAILED";
    const message = typeof rawError === "object" && rawError && "message" in rawError && typeof rawError.message === "string"
      ? rawError.message
      : "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่";
    safeUploadError({ status: response.status, classification: code });
    throw new ApiError(code, message, response.status);
  }
  if (typeof body !== "object" || !body || !("data" in body)) {
    safeUploadError({ status: response.status, classification: "INVALID_RESPONSE" });
    throw new ApiError("INVALID_RESPONSE", "รูปแบบข้อมูลจากระบบไม่ถูกต้อง", response.status);
  }
  return (body as { data: T }).data;
}
