import { NextResponse } from "next/server";
import { getProductById } from "@/lib/catalog";
import { getProductById as getProductByIdFromDb } from "@/lib/catalog-db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const product = process.env.DATABASE_URL
    ? await getProductByIdFromDb(id)
    : getProductById(id);

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
