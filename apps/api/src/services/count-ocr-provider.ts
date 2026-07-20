import { AppError } from "../errors.js";
import type { StockCount, StockCountItem } from "../models.js";

export type UploadedDocument = {
  fileName: string;
  mimeType: string;
  size: number;
  pageNumber: number;
  fingerprint?: string;
  contentBase64?: string;
};

export type CountOcrInput = {
  count: StockCount;
  items: Array<StockCountItem & { item?: { itemId: string; itemName: string; unit: string } }>;
  files: UploadedDocument[];
};

export type CountOcrRow = {
  rowNumber: number;
  rawValue: string;
  confidence: number;
};

export type CountOcrResult = {
  rows: CountOcrRow[];
  confidence?: number;
};

export type CountOcrDebugResult = {
  provider: "mock" | "typhoon";
  endpoint?: string;
  model?: string;
  files: Array<{
    fileName: string;
    mimeType: string;
    size: number;
    pageNumber: number;
    hasContent: boolean;
  }>;
  expectedRowCount: number;
  rawResponse?: string;
  rawContent: string;
  parsedJson: unknown;
  normalized: CountOcrResult;
};

export interface CountOcrProvider {
  recognize(input: CountOcrInput): Promise<CountOcrResult>;
  inspect?(input: CountOcrInput): Promise<CountOcrDebugResult>;
}

const DEFAULT_TYPHOON_BASE_URL = "https://api.opentyphoon.ai/v1";
const DEFAULT_TYPHOON_MODEL = "typhoon-ocr-preview";

export function createCountOcrProvider(): CountOcrProvider {
  if (process.env.NODE_ENV === "test") return new MockCountOcrProvider();
  const apiKey = process.env.TYPHOON_API_KEY?.trim()
    || process.env.TYPHOON_OCR_API_KEY?.trim()
    || process.env.TYPOON_API_KEY?.trim()
    || process.env.TYPOON_OCR_API_KEY?.trim()
    || process.env.API_KEYTYPHOON?.trim()
    || process.env.api_keytyphoon?.trim();
  if (!apiKey) return new MissingTyphoonCountOcrProvider();
  return new TyphoonCountOcrProvider({
    apiKey,
    baseUrl: process.env.TYPHOON_BASE_URL?.trim()
      || process.env.TYPHOON_OCR_BASE_URL?.trim()
      || process.env.TYPOON_BASE_URL?.trim()
      || process.env.TYPOON_OCR_BASE_URL?.trim()
      || DEFAULT_TYPHOON_BASE_URL,
    model: process.env.TYPHOON_MODEL?.trim()
      || process.env.TYPHOON_OCR_MODEL?.trim()
      || process.env.TYPOON_MODEL?.trim()
      || process.env.TYPOON_OCR_MODEL?.trim()
      || DEFAULT_TYPHOON_MODEL,
  });
}

class MissingTyphoonCountOcrProvider implements CountOcrProvider {
  async recognize(): Promise<CountOcrResult> {
    throw missingTyphoonConfigError();
  }

  async inspect(): Promise<CountOcrDebugResult> {
    throw missingTyphoonConfigError();
  }
}

export class MockCountOcrProvider implements CountOcrProvider {
  async recognize(input: CountOcrInput): Promise<CountOcrResult> {
    return {
      rows: input.items.map((item) => {
        const unread = item.rowNumber % 5 === 0;
        const lowConfidence = item.rowNumber % 3 === 0;
        return {
          rowNumber: item.rowNumber,
          rawValue: unread ? "" : String(item.rowNumber + (item.rowNumber % 2 ? 0.5 : 0)),
          confidence: unread ? 0 : lowConfidence ? 0.58 : 0.92,
        };
      }),
    };
  }

  async inspect(input: CountOcrInput): Promise<CountOcrDebugResult> {
    const normalized = await this.recognize(input);
    const rawContent = JSON.stringify(normalized);
    return {
      provider: "mock",
      files: debugFiles(input.files),
      expectedRowCount: input.items.length,
      rawContent,
      parsedJson: normalized,
      normalized,
    };
  }
}

type TyphoonConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export class TyphoonCountOcrProvider implements CountOcrProvider {
  constructor(private readonly config: TyphoonConfig) {}

  async recognize(input: CountOcrInput): Promise<CountOcrResult> {
    return (await this.inspect(input)).normalized;
  }

  async inspect(input: CountOcrInput): Promise<CountOcrDebugResult> {
    const missingContent = input.files.find((file) => !file.contentBase64?.trim());
    if (missingContent) {
      throw new AppError(400, "OCR_FILE_CONTENT_REQUIRED", "OCR requires uploaded file content.");
    }

    let response: Response;
    const endpoint = typhoonEndpoint(this.config.baseUrl);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an OCR engine for Thai stock-count forms. Return only valid JSON.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: buildPrompt(input) },
                ...input.files.map((file) => ({
                  type: "image_url",
                  image_url: { url: `data:${file.mimeType};base64,${file.contentBase64}` },
                })),
              ],
            },
          ],
        }),
      });
    } catch {
      throw new AppError(502, "TYPHOON_OCR_UNREACHABLE", "Typhoon OCR is unreachable.");
    }

    const bodyText = await response.text();
    if (!response.ok) {
      throw new AppError(response.status >= 500 ? 502 : response.status, "TYPHOON_OCR_FAILED", `Typhoon OCR failed (${response.status}).`);
    }

    const content = extractChatContent(bodyText);
    const parsedJson = parseJsonObject(content);
    return {
      provider: "typhoon",
      endpoint,
      model: this.config.model,
      files: debugFiles(input.files),
      expectedRowCount: input.items.length,
      rawResponse: bodyText,
      rawContent: content,
      parsedJson,
      normalized: normalizeTyphoonResult(parsedJson),
    };
  }
}

function debugFiles(files: UploadedDocument[]): CountOcrDebugResult["files"] {
  return files.map((file) => ({
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.size,
    pageNumber: file.pageNumber,
    hasContent: Boolean(file.contentBase64?.trim()),
  }));
}

function typhoonEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function buildPrompt(input: CountOcrInput): string {
  const rows = input.items.map((item) => ({
    rowNumber: item.rowNumber,
    itemId: item.itemId,
    itemName: item.item?.itemName ?? "",
    unit: item.unit,
  }));
  return [
    `Document code: ${input.count.documentCode || input.count.countId}`,
    "Process every uploaded file and every visible page in order. Do not stop after the first page.",
    "If the PDF renderer only exposes one page, return the rows you can see and leave missing rows blank.",
    "Read only the handwritten/filled counted quantity for each row.",
    "Do not use item IDs, row numbers, printed labels, or system quantities as counted quantities.",
    "If a quantity is blank or unreadable, return an empty rawValue and confidence 0.",
    "Return exactly this JSON shape: {\"rows\":[{\"rowNumber\":1,\"rawValue\":\"12.5\",\"confidence\":0.93}],\"confidence\":0.91}",
    `Expected rows: ${JSON.stringify(rows)}`,
  ].join("\n");
}

function extractChatContent(bodyText: string): string {
  let body: { choices?: Array<{ message?: { content?: unknown } }>; content?: unknown };
  try {
    body = JSON.parse(bodyText) as { choices?: Array<{ message?: { content?: unknown } }>; content?: unknown };
  } catch {
    throw new AppError(502, "INVALID_TYPHOON_OCR_RESPONSE", "Typhoon OCR returned an invalid response.");
  }
  const content = body.choices?.[0]?.message?.content ?? body.content;
  if (typeof content !== "string" || !content.trim()) throw new AppError(502, "INVALID_TYPHOON_OCR_RESPONSE", "Typhoon OCR returned an invalid response.");
  return content;
}

function parseJsonObject(value: string): unknown {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(trimmed.slice(first, last + 1));
      } catch {
        throw new AppError(502, "INVALID_TYPHOON_OCR_JSON", "Typhoon OCR did not return JSON.");
      }
    }
    throw new AppError(502, "INVALID_TYPHOON_OCR_JSON", "Typhoon OCR did not return JSON.");
  }
}

function normalizeTyphoonResult(value: unknown): CountOcrResult {
  if (!value || typeof value !== "object") throw new AppError(502, "INVALID_TYPHOON_OCR_JSON", "Typhoon OCR JSON is invalid.");
  const object = value as { rows?: unknown; confidence?: unknown };
  if (!Array.isArray(object.rows)) throw new AppError(502, "INVALID_TYPHOON_OCR_ROWS", "Typhoon OCR rows are missing.");
  return {
    rows: object.rows.flatMap((row): CountOcrRow[] => {
      if (!row || typeof row !== "object") return [];
      const candidate = row as { rowNumber?: unknown; rawValue?: unknown; value?: unknown; confidence?: unknown };
      const rowNumber = Number(candidate.rowNumber);
      if (!Number.isInteger(rowNumber) || rowNumber <= 0) return [];
      const rawValue = String(candidate.rawValue ?? candidate.value ?? "").trim();
      return [{ rowNumber, rawValue, confidence: clampConfidence(Number(candidate.confidence)) }];
    }),
    confidence: object.confidence === undefined ? undefined : clampConfidence(Number(object.confidence)),
  };
}

export function parseOcrQuantity(rawValue: string): number | null {
  const normalized = rawValue.trim().replace(/,/g, "");
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function missingTyphoonConfigError(): AppError {
  return new AppError(500, "TYPHOON_OCR_NOT_CONFIGURED", "Typhoon OCR requires TYPHOON_API_KEY or TYPHOON_OCR_API_KEY.");
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value > 1 && value <= 100) return Number((value / 100).toFixed(3));
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}
