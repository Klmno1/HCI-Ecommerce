"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconButton, Rating } from "@mui/material";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import { useCart } from "@/components/providers/cart-provider";
import type { ProductRecord } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

export function ProductCard({
  product,
  compact = false
}: {
  product: ProductRecord;
  compact?: boolean;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const hasDiscount = product.originalPrice > product.price;
  const productHref = `/products/${encodeURIComponent(product.id)}`;

  return (
    <Link
      href={productHref}
      prefetch
      onMouseEnter={() => router.prefetch(productHref)}
      onFocus={() => router.prefetch(productHref)}
      className="group block overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_16px_30px_rgba(31,50,91,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(31,50,91,0.1)]"
    >
      <article>
        <div className="relative p-3">
          <div
            className={cn("relative overflow-hidden rounded-lg bg-slate-100", compact ? "h-36" : "h-44")}
          >
            {hasDiscount ? (
              <div className="absolute left-2 top-2 rounded-md bg-[#3965ff] px-2 py-1 text-[11px] font-semibold text-white">
                {product.discountLabel}
              </div>
            ) : null}
            <div className="flex h-full items-center justify-center px-5 text-center text-sm text-slate-500">
              {product.imageUrl ? "已預留圖片路徑" : product.imageText}
            </div>
          </div>

          <IconButton
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              addItem(product);
            }}
            className="!absolute right-4 top-4 !bg-white"
            size="small"
            aria-label="加入購物車"
          >
            <ShoppingCartRoundedIcon fontSize="small" />
          </IconButton>
        </div>

        <div className="space-y-2 px-4 pb-4">
          <h3 className="line-clamp-2 min-h-[44px] text-sm font-semibold text-slate-900">{product.name}</h3>

          <div className="flex items-end gap-2">
            <span className={cn("text-2xl font-bold", hasDiscount ? "text-[#ff5a36]" : "text-slate-900")}>
              {formatPrice(product.price)}
            </span>
            {hasDiscount ? (
              <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Rating value={product.rating} precision={0.1} readOnly size="small" />
            <span>({product.reviewCount})</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.is24h ? (
              <span className="rounded-full bg-[#eaf9f3] px-2 py-1 text-[11px] font-semibold text-[#18a56f]">
                24H 到貨
              </span>
            ) : null}
            <span className="rounded-full bg-[#f3efff] px-2 py-1 text-[11px] font-semibold text-[#6b4eff]">
              {product.subcategory}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
