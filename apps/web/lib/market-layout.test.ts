import { describe, expect, it } from "vitest";
import { MARKET_STALL_GRID_CLASS } from "./market-layout";

describe("market stall layout", () => {
  it("uses content-driven auto-fit columns without hardcoded empty slots", () => {
    expect(MARKET_STALL_GRID_CLASS).toContain("repeat(auto-fit,minmax(170px,1fr))");
    expect(MARKET_STALL_GRID_CLASS).toContain("snap-mandatory");
    expect(MARKET_STALL_GRID_CLASS).not.toMatch(/grid-cols-[2-9]/);
  });
});
