import { notFound } from "next/navigation";
import { getCatalogCategories, getProductById } from "@/lib/catalog-static";
import { ProductDetailShell } from "@/components/product/product-detail-shell";

export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productPromise = getProductById(id);
  const categoriesPromise = getCatalogCategories();

  const [product, categories] = await Promise.all([productPromise, categoriesPromise]);

  if (!product) {
    notFound();
  }

  return <ProductDetailShell product={product} categories={categories} />;
}
