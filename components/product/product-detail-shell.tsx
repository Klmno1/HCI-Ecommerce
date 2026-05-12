"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import Rating from "@mui/material/Rating";
import { CartDrawer } from "@/components/catalog/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { useExperiment } from "@/components/providers/experiment-provider";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import type { ProductRecord } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type ProductDetailShellProps = {
  product: ProductRecord;
  categories: { name: string; subcategories: string[] }[];
};

function cleanDisplayText(value: string) {
  return value.replace(/\\r\\n|\\n|\\r/g, " ").replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").trim();
}

export function ProductDetailShell({ product, categories }: ProductDetailShellProps) {
  const router = useRouter();
  const { logEvent } = useExperiment();
  const [search, setSearch] = useState(product.searchKeyword);
  const [cartOpen, setCartOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const hasDiscount = product.originalPrice > product.price;

  const detailBlocks = useMemo(
    () =>
      [product.tagline, product.description, product.introduction, product.note]
        .map((entry) => cleanDisplayText(entry || ""))
        .filter(Boolean)
        .slice(0, 4),
    [product.description, product.introduction, product.note, product.tagline]
  );

  useEffect(() => {
    logEvent({
      action: "product_open",
      target: "product-detail-page",
      label: product.name,
      value: {
        productId: product.id,
        category: product.category,
        subcategory: product.subcategory
      }
    });
  }, [logEvent, product.category, product.id, product.name, product.subcategory]);

  useEffect(() => {
    if (!isRouting) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsRouting(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [isRouting]);

  const routeToCatalog = (
    params: Record<string, string>,
    action?: { target: "search" | "category" | "subcategory"; label?: string }
  ) => {
    if (action) {
      logEvent({
        action:
          action.target === "search"
            ? "search_submit"
            : action.target === "subcategory"
              ? "subcategory_select"
              : "category_select",
        target: `product-detail-${action.target}`,
        label: action.label,
        value: params
      });
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });

    setIsRouting(true);
    router.push(`/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f4f6fb_100%)]">
      <SiteHeader
        search={search}
        categories={categories}
        selectedCategory={product.category}
        selectedSubcategory={product.subcategory}
        onSearchChange={setSearch}
        onSearchSubmit={() => routeToCatalog({ search }, { target: "search", label: search })}
        onCartOpen={() => {
          setCartOpen(true);
          logEvent({ action: "cart_open", target: "product-detail-header" });
        }}
        onCategoryChange={(value) => routeToCatalog({ category: value }, { target: "category", label: value })}
        onSubcategoryChange={(value) =>
          routeToCatalog(
            {
              category: product.category,
              subcategory: value
            },
            { target: "subcategory", label: value }
          )
        }
        onCategorySubcategoryChange={(category, subcategory) =>
          routeToCatalog(
            {
              category,
              subcategory
            },
            { target: "subcategory", label: `${category} / ${subcategory}` }
          )
        }
      />

      <main className="px-4 py-6 lg:px-6">
        <div className="mx-auto max-w-[1320px]">
          <button
            type="button"
            onClick={() =>
              routeToCatalog(
                {
                  category: product.category,
                  subcategory: product.subcategory
                },
                { target: "subcategory", label: `${product.category} / ${product.subcategory}` }
              )
            }
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm"
          >
            <ArrowBackRoundedIcon fontSize="small" />
            返回商品列表
          </button>

          {isRouting ? (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
              <CircularProgress size={18} />
              載入中...
            </div>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-panel rounded-2xl p-6">
              <div className="space-y-6">
                <div className="flex aspect-[4/4.2] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-2">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-[radial-gradient(circle_at_top,_rgba(57,101,255,0.08),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#eef3fb_100%)] p-8 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm">
                        <ImageOutlinedIcon sx={{ fontSize: 32 }} />
                      </div>
                      <p className="mt-5 text-lg font-semibold text-slate-500">圖片預留區</p>
                      <p className="mt-2 max-w-md text-sm text-slate-400">{product.name}</p>
                    </div>
                  )}
                </div>

                {detailBlocks.length > 0 ? (
                  <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                    <h2 className="text-lg font-bold text-slate-900">商品敘述</h2>
                    <div className="mt-4 space-y-3">
                      {detailBlocks.map((entry, index) => (
                        <div
                          key={`${entry}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600"
                        >
                          {entry}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <section className="glass-panel rounded-2xl p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3965ff]">
                  {product.category} / {product.subcategory}
                </p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">{product.name}</h1>

                <div className="mt-4 flex items-center gap-3">
                  <Rating value={product.rating} precision={0.1} readOnly />
                  <span className="text-sm text-slate-500">{product.reviewCount} 則評價</span>
                </div>

                <div className="mt-6 rounded-2xl bg-[#f7f9ff] p-5">
                  <div className="flex items-end gap-3">
                    <span className={hasDiscount ? "text-4xl font-bold text-[#ff5a36]" : "text-4xl font-bold text-slate-900"}>
                      {formatPrice(product.price)}
                    </span>
                    {hasDiscount ? (
                      <span className="pb-1 text-lg text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hasDiscount && product.discountLabel ? (
                      <span className="rounded-full bg-[#edf2ff] px-3 py-1 text-sm font-semibold text-[#2147d1]">
                        {product.discountLabel}
                      </span>
                    ) : null}
                    {product.is24h ? (
                      <span className="rounded-full bg-[#eaf9f3] px-3 py-1 text-sm font-semibold text-[#18a56f]">
                        24H 到貨
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <InfoBadge
                    icon={<LocalShippingOutlinedIcon fontSize="small" />}
                    label="配送方式"
                    value={product.is24h ? "支援 24H 到貨" : "一般配送"}
                  />
                  <InfoBadge
                    icon={<ShoppingCartOutlinedIcon fontSize="small" />}
                    label="商品編號"
                    value={product.rawId}
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <AddToCartButton product={product} />
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(true);
                      logEvent({ action: "cart_open", target: "product-detail-secondary-button" });
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    查看購物車
                  </button>
                </div>
              </section>

              <section className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-bold text-slate-900">商品規格</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(product.features).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{key}</p>
                      <p className="mt-2 text-sm text-slate-700">{cleanDisplayText(value || "") || "未標示"}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>

      <CartDrawer
        open={cartOpen}
        onOpenChange={(nextOpen) => {
          setCartOpen(nextOpen);
          logEvent({ action: nextOpen ? "cart_open" : "cart_close", target: "product-detail-cart-drawer" });
        }}
      />
    </div>
  );
}

function InfoBadge({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-sm text-slate-800">{value}</p>
    </div>
  );
}
