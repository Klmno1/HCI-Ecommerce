import type { CatalogFilters, CatalogResponse, ProductRecord } from "@/lib/types";
import { getPostgresPool } from "@/lib/db/postgres";
import { normalizeText } from "@/lib/utils";

type ProductRow = {
  id: string;
  raw_id: string;
  name: string;
  short_name: string;
  brand: string;
  description: string;
  tagline: string;
  detail: string;
  introduction: string;
  note: string;
  price: number;
  original_price: number;
  rating: number;
  review_count: number;
  is_24h: boolean;
  discount_value: number;
  discount_label: string;
  search_keyword: string;
  category: string;
  subcategory: string;
  category_order: number;
  subcategory_order: number;
  source_file: string;
  image_text: string;
  image_url: string | null;
  image_urls: string[] | null;
  features: Record<string, string> | null;
  feature_order: string[] | null;
};

type CatalogCache = {
  products: ProductRecord[];
  categories: { name: string; subcategories: string[] }[];
};

let cachedCatalog: CatalogCache | null = null;
let cachedAt = 0;
const cacheTtlMs = 30_000;
const brandFeatureKey = "品牌";
const searchKeywordFeatureKey = "搜尋關鍵字";

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

function mapProductRow(row: ProductRow): ProductRecord {
  const imageUrls = Array.isArray(row.image_urls) ? row.image_urls : [];
  const featureOrder = Array.isArray(row.feature_order) ? row.feature_order : Object.keys(row.features ?? {});

  return {
    id: row.id,
    rawId: row.raw_id,
    name: row.name,
    shortName: row.short_name,
    brand: row.brand,
    description: row.description,
    tagline: row.tagline,
    detail: row.detail,
    introduction: row.introduction,
    note: row.note,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    is24h: row.is_24h,
    discountValue: Number(row.discount_value),
    discountLabel: row.discount_label,
    searchKeyword: row.search_keyword,
    category: row.category,
    subcategory: row.subcategory,
    sourceFile: row.source_file,
    imageText: row.image_text,
    imageUrl: row.image_url ?? imageUrls[0] ?? null,
    features: row.features ?? {},
    featureOrder
  };
}

const productSelectColumns = `
  id,
  raw_id,
  name,
  short_name,
  brand,
  description,
  tagline,
  detail,
  introduction,
  note,
  price,
  original_price,
  rating,
  review_count,
  is_24h,
  discount_value,
  discount_label,
  search_keyword,
  category,
  subcategory,
  category_order,
  subcategory_order,
  source_file,
  image_text,
  image_url,
  image_urls,
  features,
  feature_order
`;

async function loadCatalog(): Promise<CatalogCache> {
  if (cachedCatalog && Date.now() - cachedAt < cacheTtlMs) {
    return cachedCatalog;
  }

  const pool = getPostgresPool();
  const result = await pool.query<ProductRow>(`
    SELECT ${productSelectColumns}
    FROM products
    ORDER BY category_order ASC, subcategory_order ASC, source_file ASC, raw_id ASC
  `);

  const products = result.rows.map(mapProductRow);
  const categoryMap = new Map<string, { order: number; subcategories: Map<string, number> }>();

  for (const product of result.rows) {
    if (!categoryMap.has(product.category)) {
      categoryMap.set(product.category, {
        order: normalizeOrder(product.category_order),
        subcategories: new Map()
      });
    }

    const entry = categoryMap.get(product.category);
    if (entry && !entry.subcategories.has(product.subcategory)) {
      entry.subcategories.set(product.subcategory, normalizeOrder(product.subcategory_order));
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

  cachedCatalog = { products, categories };
  cachedAt = Date.now();
  return cachedCatalog;
}

function buildSearchHaystack(product: ProductRecord) {
  return normalizeText(
    [product.name, product.category, product.subcategory, ...Object.values(product.features)].join(" ")
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

export async function getCatalog(filters: CatalogFilters = {}): Promise<CatalogResponse> {
  const { products, categories } = await loadCatalog();
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
  const startIndex = (page - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize);

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

export async function getCatalogCategories() {
  return (await loadCatalog()).categories;
}

export async function getProductById(id: string) {
  const { products } = await loadCatalog();
  return products.find((product) => product.id === id || product.rawId === id) ?? null;
}

export function clearCatalogCache() {
  cachedCatalog = null;
  cachedAt = 0;
}

function normalizeOrder(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 9999;
}
