"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Rating from "@mui/material/Rating";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { CartDrawer } from "@/components/catalog/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import type { ProductRecord } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type ProductDetailShellProps = {
  product: ProductRecord;
  categories: { name: string; subcategories: string[] }[];
};

export function ProductDetailShell({ product, categories }: ProductDetailShellProps) {
  const router = useRouter();
  const [search, setSearch] = useState(product.searchKeyword);
  const [cartOpen, setCartOpen] = useState(false);
  const hasDiscount = product.originalPrice > product.price;

  const routeToCatalog = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
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
        onSearchSubmit={() => routeToCatalog({ search })}
        onCartOpen={() => setCartOpen(true)}
        onCategoryChange={(value) => routeToCatalog({ category: value })}
        onSubcategoryChange={(value) =>
          routeToCatalog({
            category: product.category,
            subcategory: value
          })
        }
      />

      <main className="px-4 py-6 lg:px-6">
        <div className="mx-auto max-w-[1320px]">
          <button
            type="button"
            onClick={() =>
              routeToCatalog({
                category: product.category,
                subcategory: product.subcategory
              })
            }
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm"
          >
            <ArrowBackRoundedIcon fontSize="small" />
            回到商品列表
          </button>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-panel rounded-2xl p-6">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4">
                  <div className="flex aspect-[4/4.2] items-center justify-center rounded-2xl bg-slate-100 p-8 text-center text-lg font-medium text-slate-500">
                    {product.imageUrl ? "這裡可以接上正式商品圖片" : product.imageText}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["細節圖預留", "情境圖預留", "包裝圖預留"].map((label) => (
                      <div
                        key={label}
                        className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-center text-xs text-slate-400"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3965ff]">
                    {product.category} / {product.subcategory}
                  </p>
                  <h1 className="mt-3 text-3xl font-bold text-slate-900">{product.name}</h1>
                  <p className="mt-3 text-base text-slate-600">
                    {product.tagline || product.description || "精選規格配置，適合日常與專業使用。"}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <Rating value={product.rating} precision={0.1} readOnly />
                    <span className="text-sm text-slate-500">{product.reviewCount} 則評論</span>
                  </div>

                  <div className="mt-6 rounded-2xl bg-[#f7f9ff] p-5">
                    <div className="flex items-end gap-3">
                      <span
                        className={hasDiscount ? "text-4xl font-bold text-[#ff5a36]" : "text-4xl font-bold text-slate-900"}
                      >
                        {formatPrice(product.price)}
                      </span>
                      {hasDiscount ? (
                        <span className="pb-1 text-lg text-slate-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {hasDiscount ? (
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
                      label="配送模式"
                      value={product.is24h ? "快速到貨" : "一般配送"}
                    />
                    <InfoBadge
                      icon={<ShoppingCartOutlinedIcon fontSize="small" />}
                      label="商品編號"
                      value={product.id}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <AddToCartButton product={product} />
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                    >
                      立即購買
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-bold text-slate-900">商品亮點</h2>
                <div className="mt-4 space-y-3">
                  {[product.tagline, product.description, product.introduction, product.note]
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((entry, index) => (
                      <div
                        key={`${entry}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600"
                      >
                        {entry}
                      </div>
                    ))}
                </div>
              </section>

              <section className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-bold text-slate-900">商品規格與特徵</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(product.features).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{key}</p>
                      <p className="mt-2 text-sm text-slate-700">{value || "未提供"}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-gradient-to-br from-[#1d4fff] to-[#7aa2ff] p-6 text-white shadow-[0_20px_45px_rgba(57,101,255,0.24)]">
                <p className="text-sm font-semibold text-white/75">加值服務</p>
                <h2 className="mt-2 text-2xl font-bold">延長保固與快速配送方案</h2>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  這裡保留給後續的推薦搭配、延保方案、加購配件與更多圖片資訊。
                </p>
              </section>
            </div>
          </section>
        </div>
      </main>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

function InfoBadge({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
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
