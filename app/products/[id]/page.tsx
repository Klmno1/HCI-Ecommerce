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
  const product = process.env.DATABASE_URL
    ? await getProductByIdFromDb(id)
    : getProductById(id);

  if (!product) {
    notFound();
  }

  const categories = process.env.DATABASE_URL
    ? await getCatalogCategoriesFromDb()
    : getCatalogCategories();

  return <ProductDetailShell product={product} categories={categories} />;
}
