import { describe, expect, it } from "vitest";
import { lockBodyScroll } from "./body-scroll-lock";

describe("body scroll lock", () => {
  it("locks scrolling and restores the exact previous overflow value", () => {
    const body = { style: { overflow: "auto" } };

    const unlock = lockBodyScroll(body);
    expect(body.style.overflow).toBe("hidden");

    unlock();
    expect(body.style.overflow).toBe("auto");
  });
});
