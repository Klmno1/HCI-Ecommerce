import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export function GET() {
  const catalog = getCatalog({ page: 1, pageSize: 1 });

  return NextResponse.json({
    categories: catalog.categories,
    availableFeatures: catalog.availableFeatures,
    priceRange: catalog.priceRange
  });
}
