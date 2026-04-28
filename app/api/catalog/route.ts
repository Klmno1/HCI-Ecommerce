import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

function parseFeatureFilters(value: string | null) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, string[]>;
    return parsed;
  } catch {
    return {};
  }
}

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const catalog = getCatalog({
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    subcategory: searchParams.get("subcategory") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    sort: (searchParams.get("sort") as "price-asc" | "price-desc" | "popular" | null) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
    featureFilters: parseFeatureFilters(searchParams.get("featureFilters"))
  });

  return NextResponse.json(catalog);
}
