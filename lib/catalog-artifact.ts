import { existsSync, promises as fs } from "fs";
import path from "path";
import { getCatalog as getSourceCatalog, getProductById as getSourceProductById, loadMapping } from "@/lib/catalog";
import type { ProductRecord } from "@/lib/types";

export type CatalogArtifact = {
  generatedAt: string;
  products: ProductRecord[];
  categories: { name: string; subcategories: string[] }[];
};

export const generatedCatalogPath = path.join(process.cwd(), "db", "generated", "catalog.json");

function toPublicImagePath(product: ProductRecord, fileName: string) {
  return `/product-images/${encodeURIComponent(product.category)}/${encodeURIComponent(product.rawId)}/${encodeURIComponent(fileName)}`;
}

async function getProductImagePaths(product: ProductRecord) {
  const imageDirectory = path.join(
    process.cwd(),
    "public",
    "product-images",
    product.category,
    product.rawId
  );

  try {
    const entries = await fs.readdir(imageDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((fileName) => toPublicImagePath(product, fileName));
  } catch {
    return [];
  }
}

export async function buildCatalogArtifact(): Promise<CatalogArtifact> {
  const mappings = loadMapping();
  const categoryMap = new Map<string, string[]>();

  for (const mapping of mappings) {
    if (!mapping.category || !mapping.keyword) {
      continue;
    }

    if (!categoryMap.has(mapping.category)) {
      categoryMap.set(mapping.category, []);
    }

    const subcategories = categoryMap.get(mapping.category);
    if (subcategories && !subcategories.includes(mapping.keyword)) {
      subcategories.push(mapping.keyword);
    }
  }

  const categories = Array.from(categoryMap.entries()).map(([name, subcategories]) => ({
    name,
    subcategories
  }));

  const productMap = new Map<string, ProductRecord>();

  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const catalog = getSourceCatalog({
        category: category.name,
        subcategory,
        page: 1,
        pageSize: 10000
      });

      for (const item of catalog.items) {
        const full = getSourceProductById(item.id);
        if (!full) {
          continue;
        }

        const imageUrls = await getProductImagePaths(full);
        productMap.set(full.id, {
          ...full,
          imageUrl: imageUrls[0] ?? null
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    products: Array.from(productMap.values()),
    categories
  };
}

export async function writeCatalogArtifact(artifact: CatalogArtifact) {
  await fs.mkdir(path.dirname(generatedCatalogPath), { recursive: true });
  await fs.writeFile(generatedCatalogPath, JSON.stringify(artifact, null, 2), "utf8");
}

export function hasGeneratedCatalogArtifact() {
  return existsSync(generatedCatalogPath);
}
