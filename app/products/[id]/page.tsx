import { notFound } from "next/navigation";
import { getCatalogCategories, getProductById } from "@/lib/catalog";
import { ProductDetailShell } from "@/components/product/product-detail-shell";

export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const categories = getCatalogCategories();

  return <ProductDetailShell product={product} categories={categories} />;
}
