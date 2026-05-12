"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircularProgress, IconButton, Rating } from "@mui/material";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { useExperiment } from "@/components/providers/experiment-provider";
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
  const { logEvent } = useExperiment();
  const [isOpening, setIsOpening] = useState(false);
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
      onClick={() => {
        setIsOpening(true);
        logEvent({
          action: "product_open",
          target: "catalog-product-card",
          label: product.shortName || product.name,
          value: {
            productId: product.id,
            category: product.category,
            subcategory: product.subcategory
          }
        });
      }}
      className="group block overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_16px_30px_rgba(31,50,91,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(31,50,91,0.1)]"
    >
      <article>
        <div className="relative p-3">
          <div className={cn("relative overflow-hidden rounded-lg bg-slate-100", compact ? "h-36" : "h-44")}>
            {discountBadgeLabel ? (
              <div className="absolute left-2 top-2 z-10 rounded-md bg-[#3965ff] px-2 py-1 text-[11px] font-semibold text-white">
                {discountBadgeLabel}
              </div>
            ) : null}

            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(57,101,255,0.08),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#eef3fb_100%)] px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/85 text-slate-400 shadow-sm">
                  <ImageOutlinedIcon />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-500">圖片預留區</p>
                <p className="mt-1 text-xs text-slate-400">{product.shortName}</p>
              </div>
            )}
          </div>

          {isOpening ? (
            <div className="absolute inset-3 z-10 flex items-center justify-center rounded-lg bg-white/78 backdrop-blur-[1px]">
              <CircularProgress size={28} />
            </div>
          ) : null}

          <IconButton
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              addItem(product, "product-card");
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
