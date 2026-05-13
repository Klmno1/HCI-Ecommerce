import { loadEnvConfig } from "@next/env";
import { promises as fs } from "fs";
import path from "path";
import { ensureDatabaseSchema } from "@/lib/db/schema";
import { getPostgresPool } from "@/lib/db/postgres";
import { getCatalog, getProductById } from "@/lib/catalog";
import { parseCsv } from "@/lib/csv";
import type { ProductRecord } from "@/lib/types";

type OrderedCategory = {
  name: string;
  subcategories: string[];
};

function toPublicImagePath(product: ProductRecord, fileName: string) {
  return `/product-images/${encodeURIComponent(product.category)}/${encodeURIComponent(product.rawId)}/${encodeURIComponent(fileName)}`;
}

async function getProductImagePaths(product: ProductRecord) {
  const imageDirectory = path.join(process.cwd(), "public", "product-images", product.category, product.rawId);

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

async function getOrderedCategories() {
  const dataDirectory = path.join(process.cwd(), "db", "Data");
  const csvFiles = await fs.readdir(dataDirectory);
  const mappingFileName = csvFiles.find((file) => file.includes("對照表") && file.endsWith(".csv"));

  if (!mappingFileName) {
    throw new Error("Unable to locate catalog mapping CSV.");
  }

  const [rawHeader, ...rows] = parseCsv(await fs.readFile(path.join(dataDirectory, mappingFileName), "utf8"));
  const header = rawHeader.map((value) => value.replace(/^\uFEFF/, "").replace(/\r/g, "").trim());
  const records = rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""])));

  const categoryKey = "分類名稱";
  const subcategoryKey = "搜尋關鍵字";

  if (!header.includes(categoryKey) || !header.includes(subcategoryKey)) {
    throw new Error("Unable to infer category order from mapping CSV.");
  }

  const categoryMap = new Map<string, string[]>();
  for (const record of records) {
    const category = String(record[categoryKey] ?? "").trim();
    const subcategory = String(record[subcategoryKey] ?? "").trim();

    if (!category || !subcategory) {
      continue;
    }

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }

    const subcategories = categoryMap.get(category);
    if (subcategories && !subcategories.includes(subcategory)) {
      subcategories.push(subcategory);
    }
  }

  return Array.from(categoryMap.entries()).map(([name, subcategories]) => ({
    name,
    subcategories
  })) satisfies OrderedCategory[];
}

async function getAllProducts(categories: OrderedCategory[]) {
  const productMap = new Map<string, ProductRecord>();
  const categoryOrder = new Map<string, number>();
  const subcategoryOrder = new Map<string, number>();

  categories.forEach((category, categoryIndex) => {
    categoryOrder.set(category.name, categoryIndex);
    category.subcategories.forEach((subcategory, subcategoryIndex) => {
      subcategoryOrder.set(`${category.name}::${subcategory}`, subcategoryIndex);
    });
  });

  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const catalog = getCatalog({
        category: category.name,
        subcategory,
        page: 1,
        pageSize: 10000
      });

      for (const item of catalog.items) {
        const full = getProductById(item.id);
        if (full) {
          productMap.set(full.id, full);
        }
      }
    }
  }

  return {
    products: Array.from(productMap.values()),
    categoryOrder,
    subcategoryOrder
  };
}

async function main() {
  loadEnvConfig(process.cwd());
  await ensureDatabaseSchema();

  const categories = await getOrderedCategories();
  const { products, categoryOrder, subcategoryOrder } = await getAllProducts(categories);
  const pool = getPostgresPool();

  await pool.query("DELETE FROM products");

  for (const product of products) {
    const imageUrls = await getProductImagePaths(product);
    const imageUrl = imageUrls[0] ?? product.imageUrl ?? null;

    await pool.query(
      `
        INSERT INTO products (
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
          feature_order,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26::jsonb, $27::jsonb, $28::jsonb, NOW(), NOW()
        )
      `,
      [
        product.id,
        product.rawId,
        product.name,
        product.shortName,
        product.brand,
        product.description,
        product.tagline,
        product.detail,
        product.introduction,
        product.note,
        product.price,
        product.originalPrice,
        product.rating,
        product.reviewCount,
        product.is24h,
        product.discountValue,
        product.discountLabel,
        product.searchKeyword,
        product.category,
        product.subcategory,
        categoryOrder.get(product.category) ?? 9999,
        subcategoryOrder.get(`${product.category}::${product.subcategory}`) ?? 9999,
        product.sourceFile,
        product.imageText,
        imageUrl,
        JSON.stringify(imageUrls),
        JSON.stringify(product.features),
        JSON.stringify(product.featureOrder ?? Object.keys(product.features))
      ]
    );
  }

  console.log(`Imported ${products.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
