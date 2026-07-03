import { describe, expect, it } from "vitest";
import { adjustQuantity, MOVEMENT_ACTIONS, movementLocationNeeds } from "./movement-workflow";

describe("stock movement workflow", () => {
  it("keeps the backend movement enums", () => {
    expect(MOVEMENT_ACTIONS.map((action) => action.value)).toEqual(["RECEIVE", "ISSUE", "WASTE", "ADJUSTMENT", "TRANSFER", "RETURN"]);
  });

  it("adjusts quantities with game controls without going below the API minimum", () => {
    expect(adjustQuantity(12, -10)).toBe(2);
    expect(adjustQuantity(2, -10)).toBe(0.01);
    expect(adjustQuantity(1, 1)).toBe(2);
    expect(adjustQuantity(1, 10)).toBe(11);
  });

  it("preserves the existing location requirements", () => {
    expect(movementLocationNeeds("TRANSFER", "increase")).toEqual({ needsFrom: true, needsTo: true });
    expect(movementLocationNeeds("ADJUSTMENT", "decrease")).toEqual({ needsFrom: true, needsTo: false });
  });
});
