import type { Item } from "./types";

export function filterValidItems<T extends Pick<Item, "itemId" | "itemName">>(items: readonly T[]): T[] {
  return items.filter((item) => item.itemId.trim().length > 0 && item.itemName.trim().length > 0);
}
