import { notFound } from "next/navigation";
import { getCatalogCategories, getProductById } from "@/lib/catalog";
import {
  getCatalogCategories as getCatalogCategoriesFromDb,
  getProductById as getProductByIdFromDb
} from "@/lib/catalog-db";
import { ProductDetailShell } from "@/components/product/product-detail-shell";

export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productPromise = process.env.DATABASE_URL
    ? getProductByIdFromDb(id)
    : Promise.resolve(getProductById(id));
  const categoriesPromise = process.env.DATABASE_URL
    ? getCatalogCategoriesFromDb()
    : Promise.resolve(getCatalogCategories());

  const [product, categories] = await Promise.all([productPromise, categoriesPromise]);

  if (!product) {
    notFound();
  }

  return <ProductDetailShell product={product} categories={categories} />;
}
