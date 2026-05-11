"use client";

import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import { useCart } from "@/components/providers/cart-provider";
import type { ProductRecord } from "@/lib/types";

export function AddToCartButton({ product }: { product: ProductRecord }) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() => addItem(product, "product-detail")}
      className="inline-flex items-center gap-2 rounded-xl bg-[#3965ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2147d1]"
    >
      <ShoppingCartRoundedIcon fontSize="small" />
      加入購物車
    </button>
  );
}
