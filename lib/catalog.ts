import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { parseCsv } from "@/lib/csv";
import { normalizeText } from "@/lib/utils";
import type { CatalogFilters, CatalogResponse, CategoryMapping, ProductRecord } from "@/lib/types";

const dataDir = path.join(process.cwd(), "db", "Data");
const mappingFilename = "搜尋關鍵字_分類對照表.csv";
const reservedKeys = new Set([
  "搜尋關鍵字",
  "商品ID",
  "商品名稱",
  "簡化名稱",
  "品牌",
  "商品描述",
  "商品標語",
  "商品說明",
  "商品介紹",
  "商品規格",
  "備註資訊",
  "售價",
  "原價",
  "商品評分",
  "評論數量",
  "24H到貨",
  "discounts"
]);

type CatalogCache = {
  products: ProductRecord[];
  categories: { name: string; subcategories: string[] }[];
};

let catalogCache: CatalogCache | null = null;

function safeNumber(value: string, fallback = 0) {
  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string) {
  return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
}

function toDiscountLabel(discountMultiplier: number, price: number, originalPrice: number) {
  if (!(originalPrice > price) || discountMultiplier <= 0) {
    return "";
  }

  const fold = discountMultiplier * 10;
  const formatted = Number.isInteger(fold) ? String(fold) : fold.toFixed(1).replace(/\.0$/, "");
  return `${formatted}折`;
}

function getImagePath(productId: string) {
  const imagesDir = path.join(dataDir, "images");
  if (!existsSync(imagesDir)) {
    return null;
  }

  const files = readdirSync(imagesDir);
  const matched = files.find((file) => file.startsWith(productId));
  return matched ? `/api/product-images/${encodeURIComponent(matched)}` : null;
}

function createProductId(rawId: string, sourceFile: string, rowIndex: number) {
  const sourceKey = Buffer.from(sourceFile.replace(/\.csv$/i, ""), "utf8").toString("base64url");
  return `${rawId}__${sourceKey}__${rowIndex}`;
}

function loadMapping(): CategoryMapping[] {
  const mappingPath = path.join(dataDir, mappingFilename);

  const [rawHeader, ...rows] = parseCsv(
    readFileSync(mappingPath, "utf8")
  );

  // 只有第一欄最容易有：
  // UTF-8 BOM (\ufeff)
  // 最後一欄容易有：
  // \r
  const header = rawHeader.map((h) =>
    h
      .replace(/^\uFEFF/, "")
      .replace(/\r/g, "")
      .trim()
  );

  return rows.map((row) => {
    const record = Object.fromEntries(
      header.map((key, index) => [key, row[index] ?? ""])
    );

    return {
      category: record["分類名稱"] ?? "未分類",
      keyword: record["搜尋關鍵字"] ?? "其他",
      outputCsv: record["輸出CSV"] ?? ""
    };
  });
}

function loadProducts(): CatalogCache {
  if (catalogCache) {
    return catalogCache;
  }

  const mappings = loadMapping();
  const mappingByFile = new Map(mappings.map((mapping) => [mapping.outputCsv, mapping]));
  const productFiles = readdirSync(dataDir).filter(
    (file) => file.endsWith(".csv") && file !== mappingFilename
  );

  const products = productFiles.flatMap((file) => {
    const fullPath = path.join(dataDir, file);
    const [header, ...rows] = parseCsv(readFileSync(fullPath, "utf8"));
    const mapping = mappingByFile.get(file);

    return rows
      .map((row, rowIndex) => {
        const raw = Object.fromEntries(header.map((key, index) => [key, (row[index] ?? "").trim()]));
        const price = safeNumber(raw["售價"], 0);
        const originalPrice = safeNumber(raw["原價"], price);
        const discountValue = safeNumber(raw.discounts ?? "0", 0);
        const rawId = raw["商品ID"] || `${file}-${Math.random()}`;
        const id = createProductId(rawId, file, rowIndex);
        const detail = raw["商品說明"] || raw["商品規格"] || "";

        const features = Object.fromEntries(
          Object.entries(raw).filter(([key, value]) => !reservedKeys.has(key) && value.length > 0)
        );

        return {
          id,
          rawId,
          name: raw["商品名稱"] || raw["簡化名稱"] || "未命名商品",
          shortName: raw["簡化名稱"] || raw["商品名稱"] || "未命名商品",
          brand: raw["品牌"] || "精選品牌",
          description: raw["商品描述"] || "",
          tagline: raw["商品標語"] || "",
          detail,
          introduction: raw["商品介紹"] || "",
          note: raw["備註資訊"] || "",
          price,
          originalPrice,
          rating: safeNumber(raw["商品評分"], 0),
          reviewCount: safeNumber(raw["評論數量"], 0),
          is24h: parseBoolean(raw["24H到貨"] ?? ""),
          discountValue,
          discountLabel: toDiscountLabel(discountValue, price, originalPrice),
          searchKeyword: raw["搜尋關鍵字"] || mapping?.keyword || "其他",
          category: mapping?.category || file.split("_")[0] || "未分類",
          subcategory: mapping?.keyword || file.replace(".csv", "").split("_")[1] || "其他",
          sourceFile: file,
          imageText: `${raw["簡化名稱"] || raw["商品名稱"] || "商品"} 圖片預留區`,
          imageUrl: getImagePath(rawId),
          features
        } satisfies ProductRecord;
      })
      .filter((product) => product.name.length > 0);
  });

  const categoryMap = new Map<string, Set<string>>();
  for (const mapping of mappings) {
    if (!categoryMap.has(mapping.category)) {
      categoryMap.set(mapping.category, new Set());
    }
    categoryMap.get(mapping.category)?.add(mapping.keyword);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, set]) => ({
    name,
    subcategories: Array.from(set.values())
  }));

  catalogCache = { products, categories };
  return catalogCache;
}

function buildSearchHaystack(product: ProductRecord) {
  return normalizeText(
    [
      product.name,
      product.category,
      product.subcategory,
      ...Object.values(product.features)
    ].join(" ")
  );
}

function filterBySearch(items: ProductRecord[], search?: string) {
  if (!search) {
    return items;
  }

  const keywords = search
    .split(/\s+/)
    .map((part) => normalizeText(part))
    .filter(Boolean);

  return items.filter((product) => {
    const haystack = buildSearchHaystack(product);
    return keywords.every((part) => haystack.includes(part));
  });
}

function filterByFeatures(items: ProductRecord[], featureFilters?: Record<string, string[]>) {
  if (!featureFilters) {
    return items;
  }

  return items.filter((product) =>
    Object.entries(featureFilters).every(([feature, values]) => {
      if (!values.length) {
        return true;
      }
      const current = product.features[feature];
      return current ? values.includes(current) : false;
    })
  );
}

function sortProducts(items: ProductRecord[], sort: CatalogFilters["sort"]) {
  const sorted = [...items];
  if (sort === "price-asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sort === "popular") {
    sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  } else {
    sorted.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
  }
  return sorted;
}

export function getCatalog(filters: CatalogFilters = {}): CatalogResponse {
  const { products, categories } = loadProducts();
  let scopedProducts = [...products];

  if (filters.category) {
    scopedProducts = scopedProducts.filter((product) => product.category === filters.category);
  }

  if (filters.subcategory) {
    scopedProducts = scopedProducts.filter((product) => product.subcategory === filters.subcategory);
  }

  const baseProducts = filterBySearch([...scopedProducts], filters.search);
  const allPrices = baseProducts.map((product) => product.price);
  const priceRange = {
    min: allPrices.length ? Math.min(...allPrices) : 0,
    max: allPrices.length ? Math.max(...allPrices) : 0
  };

  const clampPrice = (value: number, lower: number, upper: number) => {
    if (!Number.isFinite(value)) {
      return lower;
    }
    return Math.min(Math.max(value, lower), upper);
  };

  const normalizePrice = (value: number | undefined, fallback: number) =>
    typeof value === "number" ? clampPrice(value, priceRange.min, priceRange.max) : fallback;

  const normalizedMinPrice =
    typeof filters.minPrice === "number" ? normalizePrice(filters.minPrice, priceRange.min) : undefined;
  const normalizedMaxPrice =
    typeof filters.maxPrice === "number" ? normalizePrice(filters.maxPrice, priceRange.max) : undefined;

  const activeMinPrice =
    typeof normalizedMinPrice === "number" || typeof normalizedMaxPrice === "number"
      ? Math.min(normalizedMinPrice ?? priceRange.min, normalizedMaxPrice ?? priceRange.max)
      : undefined;
  const activeMaxPrice =
    typeof normalizedMinPrice === "number" || typeof normalizedMaxPrice === "number"
      ? Math.max(normalizedMinPrice ?? priceRange.min, normalizedMaxPrice ?? priceRange.max)
      : undefined;

  let filtered = [...baseProducts];

  const { minRating } = filters;

  if (typeof activeMinPrice === "number") {
    filtered = filtered.filter((product) => product.price >= activeMinPrice);
  }

  if (typeof activeMaxPrice === "number") {
    filtered = filtered.filter((product) => product.price <= activeMaxPrice);
  }

  if (typeof minRating === "number" && minRating > 0) {
    filtered = filtered.filter((product) => product.rating >= minRating);
  }

  if (filters.delivery === "24h") {
    filtered = filtered.filter((product) => product.is24h);
  } else if (filters.delivery === "normal") {
    filtered = filtered.filter((product) => !product.is24h);
  }

  filtered = filterByFeatures(filtered, filters.featureFilters);
  filtered = sortProducts(filtered, filters.sort);

  const availableFeatures =
    filters.category || filters.subcategory
      ? Object.fromEntries(
          Array.from(
            scopedProducts.reduce<Map<string, Set<string>>>((map, product) => {
              Object.entries(product.features).forEach(([key, value]) => {
                if (!map.has(key)) {
                  map.set(key, new Set());
                }
                map.get(key)?.add(value);
              });
              return map;
            }, new Map()).entries()
          )
            .map(([key, values]) => [key, Array.from(values.values()).slice(0, 12)])
            .filter(([, values]) => values.length > 1)
            .slice(0, 10)
        )
      : {};

  const pageSize = filters.pageSize ?? 16;
  const page = Math.max(filters.page ?? 1, 1);
  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    categories,
    availableFeatures,
    priceRange
  };
}

export function getCatalogCategories() {
  return loadProducts().categories;
}

export function getProductById(id: string) {
  const { products } = loadProducts();
  return products.find((product) => product.id === id || product.rawId === id) ?? null;
}

export function getFeaturedProducts(limit = 4) {
  const { products } = loadProducts();
  return [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, limit);
}
