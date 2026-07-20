import { afterEach, describe, expect, it } from "vitest";
import type { StockCount } from "../models.js";
import { createCountOcrProvider, type CountOcrInput } from "./count-ocr-provider.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalTyphoonApiKey = process.env.TYPHOON_API_KEY;
const originalTyphoonOcrApiKey = process.env.TYPHOON_OCR_API_KEY;
const originalTypoonApiKey = process.env.TYPOON_API_KEY;
const originalTypoonOcrApiKey = process.env.TYPOON_OCR_API_KEY;
const originalApiKeyTyphoon = process.env.API_KEYTYPHOON;
const originalLowerApiKeyTyphoon = process.env.api_keytyphoon;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  restoreEnv("TYPHOON_API_KEY", originalTyphoonApiKey);
  restoreEnv("TYPHOON_OCR_API_KEY", originalTyphoonOcrApiKey);
  restoreEnv("TYPOON_API_KEY", originalTypoonApiKey);
  restoreEnv("TYPOON_OCR_API_KEY", originalTypoonOcrApiKey);
  restoreEnv("API_KEYTYPHOON", originalApiKeyTyphoon);
  restoreEnv("api_keytyphoon", originalLowerApiKeyTyphoon);
});

describe("count OCR provider selection", () => {
  it("requires Typhoon configuration outside tests instead of falling back to mock OCR", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.TYPHOON_API_KEY;
    delete process.env.TYPHOON_OCR_API_KEY;
    delete process.env.TYPOON_API_KEY;
    delete process.env.TYPOON_OCR_API_KEY;
    delete process.env.API_KEYTYPHOON;
    delete process.env.api_keytyphoon;

    const provider = createCountOcrProvider();
    await expect(provider.recognize(input())).rejects.toMatchObject({
      statusCode: 500,
      code: "TYPHOON_OCR_NOT_CONFIGURED",
    });
  });
});

function input(): CountOcrInput {
  return {
    count: { countId: "CNT-1", documentCode: "CNT-20260718-001" } as StockCount,
    items: [],
    files: [],
  };
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
