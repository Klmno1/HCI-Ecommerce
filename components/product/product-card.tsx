"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconButton, Rating } from "@mui/material";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import { useCart } from "@/components/providers/cart-provider";
import { getProductTags } from "@/lib/product-tags";
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
  const productTags = getProductTags(product);
  const discountBadgeLabel = getDiscountBadgeLabel(product);

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
            {discountBadgeLabel ? (
              <div className="absolute left-2 top-2 rounded-md bg-[#3965ff] px-2 py-1 text-[11px] font-semibold text-white">
                {discountBadgeLabel}
              </div>
            ) : null}
            <div className="flex h-full items-center justify-center px-5 text-center text-sm text-slate-500">
              {product.imageUrl ? "商品圖片載入中" : product.imageText}
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
          <h3 className="line-clamp-2 min-h-[44px] text-sm font-semibold text-slate-900">
            {product.name}
          </h3>

          <div className="flex items-end gap-2">
            <span
              className={cn("text-2xl font-bold", hasDiscount ? "text-[#ff5a36]" : "text-slate-900")}
            >
              {formatPrice(product.price)}
            </span>
            {hasDiscount ? (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Rating value={product.rating} precision={0.1} readOnly size="small" />
            <span>({product.reviewCount})</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {productTags.map((tag) => (
              <span
                key={`${product.id}-${tag.label}`}
                className={cn(
                  "rounded-full px-2 py-1 text-[11px] font-semibold",
                  tag.tone === "delivery" && "bg-[#eaf9f3] text-[#18a56f]",
                  tag.tone === "rating" && "bg-[#fff6df] text-[#c98a00]",
                  tag.tone === "feature" && "bg-[#eef3ff] text-[#355cc8]"
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}

function getDiscountBadgeLabel(product: ProductRecord) {
  const existingLabel = product.discountLabel.trim();
  if (existingLabel) {
    return existingLabel;
  }

  if (!(product.originalPrice > product.price) || product.originalPrice <= 0) {
    return "";
  }

  const fold = (product.price / product.originalPrice) * 10;
  const formatted = Number.isInteger(fold) ? String(fold) : fold.toFixed(1).replace(/\.0$/, "");
  return `${formatted}折`;
}
