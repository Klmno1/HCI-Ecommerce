import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { getCatalog as getCatalogFromDb } from "@/lib/catalog-db";

export async function GET() {
  const catalog = process.env.DATABASE_URL
    ? await getCatalogFromDb({ page: 1, pageSize: 1 })
    : getCatalog({ page: 1, pageSize: 1 });

  return NextResponse.json({
    categories: catalog.categories,
    availableFeatures: catalog.availableFeatures,
    priceRange: catalog.priceRange
  });
}
