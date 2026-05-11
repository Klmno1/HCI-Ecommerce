import type { ProductRecord } from "@/lib/types";

type ProductTag = {
  label: string;
  tone: "delivery" | "rating" | "feature";
};

const CATEGORY_FEATURE_PRIORITY: Record<string, string[]> = {
  "3C": ["RAM記憶體", "ROM儲存空間", "螢幕尺寸", "作業系統"],
  "居家用品": ["特色功能", "材質", "類型"],
  "服飾": ["材質", "款式", "袖長", "版型"],
  "生活用品": ["功能", "材質", "類型"],
  "食品與飲品": ["口味", "類型", "規格"]
};

const INVALID_TAG_VALUES = new Set([
  "未標示",
  "未標明",
  "無",
  "無資料",
  "不適用",
  "n/a",
  "na",
  "-",
  "--",
  "none"
]);

const INVALID_TAG_PATTERNS = [
  "未標",
  "詳見",
  "請見",
  "依商品",
  "依原廠",
  "請參考",
  "如圖",
  "隨機",
  "多款",
  "多色"
];

function isMeaningfulFeatureValue(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();

  if (!trimmed) {
    return false;
  }

  if (trimmed.length > 10) {
    return false;
  }

  if (INVALID_TAG_VALUES.has(normalized)) {
    return false;
  }

  return !INVALID_TAG_PATTERNS.some((pattern) => trimmed.includes(pattern));
}

function formatFeatureTag(key: string, value: string) {
  const trimmed = value.trim();
  if (!isMeaningfulFeatureValue(trimmed)) {
    return null;
  }

  if (key === "RAM記憶體") {
    return trimmed.toUpperCase().includes("RAM") ? trimmed : `${trimmed} RAM`;
  }

  if (key === "螢幕尺寸") {
    return trimmed.replace("吋", " 吋");
  }

  return trimmed;
}

function getCategoryFeatureTag(product: ProductRecord) {
  const keys = CATEGORY_FEATURE_PRIORITY[product.category] ?? [];

  for (const key of keys) {
    const value = product.features[key];
    if (!value) {
      continue;
    }

    const formatted = formatFeatureTag(key, value);
    if (formatted) {
      return formatted;
    }
  }

  return null;
}

export function getProductTags(product: ProductRecord): ProductTag[] {
  const tags: ProductTag[] = [];

  if (product.is24h) {
    tags.push({ label: "24H 到貨", tone: "delivery" });
  }

  if (product.rating >= 4.5) {
    tags.push({ label: "高評價", tone: "rating" });
  }

  const featureTag = getCategoryFeatureTag(product);
  if (featureTag) {
    tags.push({ label: featureTag, tone: "feature" });
  }

  return tags.slice(0, 3);
}
