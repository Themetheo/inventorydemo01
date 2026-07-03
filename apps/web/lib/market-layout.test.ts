import { describe, expect, it } from "vitest";
import { MARKET_STALL_GRID_CLASS } from "./market-layout";

describe("market stall layout", () => {
  it("uses a scrollable, touch-friendly row without hardcoded empty slots", () => {
    expect(MARKET_STALL_GRID_CLASS).toContain("overflow-x-auto");
    expect(MARKET_STALL_GRID_CLASS).toContain("snap-mandatory");
    expect(MARKET_STALL_GRID_CLASS).not.toMatch(/grid-cols-[2-9]/);
  });
});
