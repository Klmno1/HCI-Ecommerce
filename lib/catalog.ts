import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { parseCsv } from "@/lib/csv";
import { normalizeText } from "@/lib/utils";
import type { CatalogFilters, CatalogResponse, CategoryMapping, ProductRecord } from "@/lib/types";

const dataDir = path.join(process.cwd(), "db", "Data");
const mappingFilename = "搜尋關鍵字_分類對照表.csv";
const brandFeatureKey = "品牌";
const searchKeywordFeatureKey = "搜尋關鍵字";
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

function uniqueInOrder(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function splitFeatureValue(value: string) {
  return uniqueInOrder(
    value
      .split(/[,\uff0c\u3001]/)
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function productFeatureValues(product: ProductRecord, feature: string) {
  if (feature === brandFeatureKey) {
    return product.brand.trim() ? [product.brand.trim()] : [];
  }

  const current = product.features[feature];
  return current ? splitFeatureValue(current) : [];
}

function orderedFeatureNames(items: ProductRecord[]) {
  const names: string[] = [brandFeatureKey];

  for (const product of items) {
    const featureOrder = product.featureOrder?.length ? product.featureOrder : Object.keys(product.features);
    names.push(...featureOrder.map((key) => key.trim()).filter(Boolean));
  }

  return uniqueInOrder(names).filter((name) => name !== searchKeywordFeatureKey);
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

export function loadMapping(): CategoryMapping[] {
  const mappingPath = path.join(dataDir, mappingFilename);
  const [rawHeader, ...rows] = parseCsv(readFileSync(mappingPath, "utf8"));
  const header = rawHeader.map((value) => value.replace(/^\uFEFF/, "").replace(/\r/g, "").trim());

  return rows.map((row) => {
    const record = Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""]));

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

  const categoryOrderMap = new Map<string, number>();
  const subcategoryOrderMap = new Map<string, number>();

  mappings.forEach((mapping, index) => {
    if (!categoryOrderMap.has(mapping.category)) {
      categoryOrderMap.set(mapping.category, categoryOrderMap.size);
    }
    subcategoryOrderMap.set(`${mapping.category}::${mapping.keyword}`, index);
  });

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
        const rawId = raw["商品ID"] || `${file}-${rowIndex}`;
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
          features,
          featureOrder: Object.keys(features)
        } satisfies ProductRecord;
      })
      .filter((product) => product.name.length > 0);
  });

  const categoryMap = new Map<string, { order: number; subcategories: Map<string, number> }>();
  for (const product of products) {
    if (!categoryMap.has(product.category)) {
      categoryMap.set(product.category, {
        order: categoryOrderMap.get(product.category) ?? 9999,
        subcategories: new Map()
      });
    }

    const entry = categoryMap.get(product.category);
    if (entry && !entry.subcategories.has(product.subcategory)) {
      entry.subcategories.set(
        product.subcategory,
        subcategoryOrderMap.get(`${product.category}::${product.subcategory}`) ?? 9999
      );
    }
  }

  const categories = Array.from(categoryMap.entries())
    .sort((a, b) => a[1].order - b[1].order || a[0].localeCompare(b[0], "zh-Hant"))
    .map(([name, meta]) => ({
      name,
      subcategories: Array.from(meta.subcategories.entries())
        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], "zh-Hant"))
        .map(([subcategory]) => subcategory)
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
  if (!featureFilters || Object.keys(featureFilters).length === 0) {
    return items;
  }

  return items.filter((product) =>
    Object.entries(featureFilters).every(([feature, values]) => {
      if (!values.length) {
        return true;
      }

      return productFeatureValues(product, feature).some((value) => values.includes(value));
    })
  );
}

function getAvailableFeatures(items: ProductRecord[]) {
  return Object.fromEntries(
    orderedFeatureNames(items)
      .map((key): [string, string[]] => {
        if (key === brandFeatureKey) {
          const values = uniqueInOrder(
            items.map((product) => product.brand.trim()).filter(Boolean)
          );
          return [key, values];
        }

        const values = uniqueInOrder(
          items.flatMap((product) => productFeatureValues(product, key))
        );

        return [key, values];
      })
      .filter(([, values]) => values.length > 1)
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
  let filtered = [...products];

  if (filters.category) {
    filtered = filtered.filter((product) => product.category === filters.category);
  }

  if (filters.subcategory) {
    filtered = filtered.filter((product) => product.subcategory === filters.subcategory);
  }

  filtered = filterBySearch(filtered, filters.search);
  const featureSource = [...filtered];
  const { minPrice, maxPrice, minRating } = filters;

  if (typeof minPrice === "number") {
    filtered = filtered.filter((product) => product.price >= minPrice);
  }

  if (typeof maxPrice === "number") {
    filtered = filtered.filter((product) => product.price <= maxPrice);
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
    filters.category || filters.subcategory ? getAvailableFeatures(featureSource) : {};

  const featureSourcePrices = featureSource.map((product) => product.price);
  const priceRange = {
    min: featureSourcePrices.length ? Math.min(...featureSourcePrices) : 0,
    max: featureSourcePrices.length ? Math.max(...featureSourcePrices) : 0
  };

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
