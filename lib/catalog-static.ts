import { existsSync, readFileSync, statSync } from "fs";
import path from "path";
import type { CatalogArtifact } from "@/lib/catalog-artifact";
import type { CatalogFilters, CatalogResponse, ProductRecord } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

const brandFeatureKey = "品牌";
const searchKeywordFeatureKey = "搜尋關鍵字";

let cachedCatalog: CatalogArtifact | null = null;
let cachedMtimeMs = -1;
const generatedCatalogPath = path.join(process.cwd(), "db", "generated", "catalog.json");

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
          const values = uniqueInOrder(items.map((product) => product.brand.trim()).filter(Boolean));
          return [key, values];
        }

        const values = uniqueInOrder(items.flatMap((product) => productFeatureValues(product, key)));
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

async function loadCatalogArtifact() {
  if (!existsSync(generatedCatalogPath)) {
    throw new Error(`Generated catalog not found at ${generatedCatalogPath}. Run catalog:generate before starting the app.`);
  }

  const nextMtimeMs = statSync(generatedCatalogPath).mtimeMs;

  if (cachedCatalog && cachedMtimeMs === nextMtimeMs) {
    return cachedCatalog;
  }

  const parsed = JSON.parse(readFileSync(generatedCatalogPath, "utf8")) as CatalogArtifact;
  cachedCatalog = parsed;
  cachedMtimeMs = nextMtimeMs;
  return parsed;
}

export async function getCatalog(filters: CatalogFilters = {}): Promise<CatalogResponse> {
  const { products, categories } = await loadCatalogArtifact();
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

  const availableFeatures = filters.category || filters.subcategory ? getAvailableFeatures(featureSource) : {};
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
  return (await loadCatalogArtifact()).categories;
}

export async function getProductById(id: string) {
  const { products } = await loadCatalogArtifact();
  return products.find((product) => product.id === id || product.rawId === id) ?? null;
}

export function clearCatalogCache() {
  cachedCatalog = null;
  cachedMtimeMs = -1;
}
