export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  }).format(value);
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .normalize("NFKC");
}
