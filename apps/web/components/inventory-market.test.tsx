import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RequestableItem } from "@/lib/types";
import { ItemMarketCard } from "./inventory-market";

describe("ItemMarketCard", () => {
  it("renders one real item without a fallback NO ID card", () => {
    const item: RequestableItem = {
      itemId: "I1",
      itemName: "ข้าว",
      categoryId: "C1",
      unit: "kg",
      imageUrl: "/images/items/rice.webp",
      description: "",
      isActive: true,
      createdAt: "now",
      totalQty: 5,
      storeItem: {
        storeItemId: "SI1",
        branchId: "B1",
        itemId: "I1",
        minQty: 1,
        targetQty: 10,
        defaultLocationId: "L1",
        allowRequest: true,
        requireDailyCount: false,
        isActive: true,
      },
    };

    const markup = renderToStaticMarkup(<ItemMarketCard item={item} selected={false} onToggle={() => undefined} />);

    expect(markup.match(/<article/g)).toHaveLength(1);
    expect(markup).toContain("ข้าว");
    expect(markup).not.toContain("NO ID");
    expect(markup).toContain("grid-cols-2 gap-3");
    expect(markup.match(/flex min-w-0 flex-col gap-2/g)).toHaveLength(2);
    expect(markup.match(/h-10 w-full min-w-0/g)).toHaveLength(2);
    expect(markup.match(/leading-normal/g)).toHaveLength(2);
    expect(markup).toContain("value=\"1\"");
    expect(markup).toContain("value=\"10\"");
    expect(markup).toContain("mt-4 min-h-12 w-full");
  });
});
