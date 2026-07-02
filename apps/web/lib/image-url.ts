const SUPPORTED_IMAGE = /\.(?:webp|png|jpe?g)(?:[?#].*)?$/i;

export function normalizeImageUrl(value?: string | null): string {
  const input = value?.trim();
  if (!input || !SUPPORTED_IMAGE.test(input)) return "";
  if (/^https:\/\//i.test(input)) return input;
  if (/^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith("//")) return "";
  return input.startsWith("/") ? input : `/${input}`;
}

export function isValidItemImageInput(value: string): boolean {
  const input = value.trim();
  if (!input) return true;
  return (input.startsWith("/") || /^https:\/\//i.test(input)) && normalizeImageUrl(input) !== "";
}

export function getItemPlaceholderText(itemName: string): string {
  const name = itemName.trim();
  if (!name) return "?";
  if (name.startsWith("หมู")) return "ม";
  return Array.from(name)[0] ?? "?";
}

export function shouldShowItemImage(src: string | null | undefined, failed: boolean): boolean {
  return !failed && normalizeImageUrl(src) !== "";
}
