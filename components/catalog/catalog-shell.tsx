"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import Rating from "@mui/material/Rating";
import * as Tabs from "@radix-ui/react-tabs";
import { CartDrawer } from "@/components/catalog/cart-drawer";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { useExperiment } from "@/components/providers/experiment-provider";
import { ProductCard } from "@/components/product/product-card";
import type { CatalogResponse, ProductRecord } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch catalog");
  }
  return (await response.json()) as CatalogResponse;
};

type FilterState = {
  search: string;
  category: string;
  subcategory: string;
  minPrice?: number;
  maxPrice?: number;
  minRating: number;
  delivery: "all" | "24h" | "normal";
  featureFilters: Record<string, string[]>;
  sort: "recommended" | "price-asc" | "price-desc" | "popular";
  page: number;
};

const defaultFilters: FilterState = {
  search: "",
  category: "",
  subcategory: "",
  minRating: 0,
  delivery: "all",
  featureFilters: {},
  sort: "recommended",
  page: 1
};

function getProductListKey(product: ProductRecord, scope: string) {
  return `${scope}-${product.sourceFile}-${product.id}`;
}

const adCards = [
  {
    title: "品牌聯名快閃",
    subtitle: "5 折優惠",
    body: "熱門品類同步補貨",
    accent: "from-[#4b7bff] to-[#6b8cff]"
  },
  {
    title: "會員加碼禮券",
    subtitle: "滿額現折",
    body: "結帳再疊加人氣優惠",
    accent: "from-[#8348ff] to-[#e04988]"
  }
];

function readFiltersFromParams(params: URLSearchParams): FilterState {
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const minRating = params.get("minRating");
  const page = params.get("page");
  const sort = params.get("sort");
  const delivery = params.get("delivery");
  const featureFilters = params.get("featureFilters");

  let parsedFeatureFilters: Record<string, string[]> = {};
  if (featureFilters) {
    try {
      const parsed = JSON.parse(featureFilters);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsedFeatureFilters = Object.entries(parsed).reduce<Record<string, string[]>>(
          (acc, [key, value]) => {
            if (
              typeof key === "string" &&
              Array.isArray(value) &&
              value.every((item) => typeof item === "string")
            ) {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
      }
    } catch {
      parsedFeatureFilters = {};
    }
  }

  return {
    search: params.get("search") ?? "",
    category: params.get("category") ?? "",
    subcategory: params.get("subcategory") ?? "",
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : 0,
    delivery: delivery === "24h" || delivery === "normal" ? delivery : "all",
    featureFilters: parsedFeatureFilters,
    sort:
      sort === "price-asc" || sort === "price-desc" || sort === "popular"
        ? sort
        : "recommended",
    page: page ? Number(page) : 1
  };
}

export function CatalogShell() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logEvent } = useExperiment();
  const [filters, setFilters] = useState<FilterState>(() =>
    readFiltersFromParams(new URLSearchParams())
  );
  const [draftSearch, setDraftSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  useEffect(() => {
    const nextFilters = readFiltersFromParams(new URLSearchParams(searchParams.toString()));
    setFilters(nextFilters);
    setDraftSearch(nextFilters.search);
  }, [searchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.subcategory) params.set("subcategory", filters.subcategory);
    if (typeof filters.minPrice === "number") params.set("minPrice", String(filters.minPrice));
    if (typeof filters.maxPrice === "number") params.set("maxPrice", String(filters.maxPrice));
    if (filters.minRating > 0) params.set("minRating", String(filters.minRating));
    if (filters.delivery !== "all") params.set("delivery", filters.delivery);
    if (Object.keys(filters.featureFilters).length > 0) {
      params.set("featureFilters", JSON.stringify(filters.featureFilters));
    }
    if (filters.sort !== "recommended") params.set("sort", filters.sort);
    params.set("page", String(filters.page));
    params.set("pageSize", "12");
    return `/api/catalog?${params.toString()}`;
  }, [filters]);

  const { data, isLoading, isValidating, error } = useSWR(queryString, fetcher, {
    keepPreviousData: true
  });

  useEffect(() => {
    if (!(isLoading || isValidating)) {
      setShowLoadingIndicator(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLoadingIndicator(true);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isLoading, isValidating]);

  const items = data?.items ?? [];
  const spotlightProducts = items.slice(0, 3);
  const heroRowItems = items.slice(0, 4);
  const lowerGridItems = items.slice(4, 12);
  const sortTabs: Array<{ label: string; value: FilterState["sort"] }> = [
    { label: "推薦", value: "recommended" },
    { label: "價格：低到高", value: "price-asc" },
    { label: "價格：高到低", value: "price-desc" },
    { label: "熱門", value: "popular" }
  ];

  const updateRoute = (next: FilterState) => {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.category) params.set("category", next.category);
    if (next.subcategory) params.set("subcategory", next.subcategory);
    if (typeof next.minPrice === "number") params.set("minPrice", String(next.minPrice));
    if (typeof next.maxPrice === "number") params.set("maxPrice", String(next.maxPrice));
    if (next.minRating > 0) params.set("minRating", String(next.minRating));
    if (next.delivery !== "all") params.set("delivery", next.delivery);
    if (Object.keys(next.featureFilters).length > 0) {
      params.set("featureFilters", JSON.stringify(next.featureFilters));
    }
    if (next.sort !== "recommended") params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState(window.history.state, "", href);
  };

  const patchFilters = (patch: Partial<FilterState>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    updateRoute(next);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const resetFiltersForScopeChange = (patch: Partial<FilterState>) =>
    patchFilters({
      ...patch,
      search: "",
      minPrice: undefined,
      maxPrice: undefined,
      minRating: 0,
      delivery: "all",
      featureFilters: {},
      sort: "recommended",
      page: 1
    });

  useEffect(() => {
    if (!data || !filters.category || !filters.subcategory) {
      return;
    }

    const selectedCategory = data.categories.find(
      (category) => category.name === filters.category
    );
    if (selectedCategory && !selectedCategory.subcategories.includes(filters.subcategory)) {
      patchFilters({
        subcategory: "",
        featureFilters: {},
        minPrice: undefined,
        maxPrice: undefined,
        page: 1
      });
    }
  }, [data, filters.category, filters.subcategory]);

  const selectedCategoryName = filters.subcategory
    ? `${filters.category} - ${filters.subcategory}`
    : filters.category || "精選商品總覽";

  return (
    <div className="app-shell">
      <SiteHeader
        search={draftSearch}
        categories={data?.categories ?? []}
        selectedCategory={filters.category}
        selectedSubcategory={filters.subcategory}
        onHomeClick={() => {
          setFilters(defaultFilters);
          setDraftSearch("");
          window.location.assign("/");
        }}
        onSearchChange={setDraftSearch}
        onSearchSubmit={() => {
          const nextSearch = draftSearch.trim();
          patchFilters({
            ...defaultFilters,
            search: nextSearch,
            page: 1
          });
          setDraftSearch("");
          logEvent({
            action: "search_submit",
            target: "header-search",
            label: nextSearch || "empty-search",
            value: { keyword: nextSearch, scope: "all-products" }
          });
        }}
        onCartOpen={() => {
          setCartOpen(true);
          logEvent({ action: "cart_open", target: "header-cart-button" });
        }}
        onCategoryChange={(value) => {
          resetFiltersForScopeChange({
            category: value,
            subcategory: ""
          });
          logEvent({ action: "category_select", target: "header-category", label: value });
        }}
        onSubcategoryChange={(value) => {
          resetFiltersForScopeChange({
            category: filters.category,
            subcategory: value
          });
          logEvent({ action: "subcategory_select", target: "header-subcategory", label: value });
        }}
        onCategorySubcategoryChange={(category, subcategory) => {
          resetFiltersForScopeChange({
            category,
            subcategory
          });
          logEvent({
            action: "subcategory_select",
            target: "header-mega-menu",
            label: `${category} / ${subcategory}`,
            value: { category, subcategory }
          });
        }}
      />

      <main className="mx-auto flex max-w-[1560px] gap-4 px-3 py-5 lg:px-4">
        <FilterSidebar
          key={`${filters.category}::${filters.subcategory}::${filters.search}`}
          data={data}
          filters={filters}
          onChange={(next) => {
            patchFilters({ ...next, page: 1 });
            logEvent({
              action: "filter_change",
              target: "sidebar-filter",
              value: {
                minPrice: next.minPrice,
                maxPrice: next.maxPrice,
                minRating: next.minRating,
                delivery: next.delivery,
                featureFilters: next.featureFilters
              }
            });
          }}
          onReset={() => {
            patchFilters({
              search: filters.search,
              category: filters.category,
              subcategory: filters.subcategory,
              minPrice: undefined,
              maxPrice: undefined,
              minRating: 0,
              delivery: "all",
              featureFilters: {},
              sort: "recommended",
              page: 1
            });
            logEvent({
              action: "filter_reset",
              target: "sidebar-reset",
              value: {
                category: filters.category,
                subcategory: filters.subcategory
              }
            });
          }}
        />

        <section className="min-w-0 flex-1 space-y-5">
          <div className="glass-panel rounded-lg px-5 py-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3965ff]">
                Search Result
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{selectedCategoryName}</h1>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-4">
              <div className="glass-panel rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-500">
                      {data?.total ?? 0} 件商品
                    </span>
                    {showLoadingIndicator ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CircularProgress size={16} />
                        載入中...
                      </div>
                    ) : null}
                  </div>

                  <Tabs.Root
                    value={filters.sort}
                    onValueChange={(value) => {
                      patchFilters({
                        sort: value as FilterState["sort"],
                        page: 1
                      });
                      logEvent({ action: "sort_change", target: value, label: value });
                    }}
                  >
                    <Tabs.List className="flex flex-wrap gap-2">
                      {sortTabs.map((tab) => (
                        <Tabs.Trigger
                          key={tab.value}
                          value={tab.value}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 data-[state=active]:border-[#3965ff] data-[state=active]:bg-[#edf2ff] data-[state=active]:text-[#2147d1]"
                        >
                          {tab.label}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.List>
                  </Tabs.Root>
                </div>
              </div>

              {isLoading && !data ? (
                <div className="glass-panel flex min-h-[480px] items-center justify-center rounded-lg">
                  <CircularProgress />
                </div>
              ) : error ? (
                <div className="glass-panel rounded-lg p-10 text-center text-sm text-red-500">
                  商品資料載入失敗，請重新整理後再試。
                </div>
              ) : items.length === 0 ? (
                <div className="glass-panel rounded-lg p-10 text-center text-sm text-slate-500">
                  目前沒有符合條件的商品，請調整搜尋或篩選條件。
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {heroRowItems.map((product) => (
                    <ProductCard key={getProductListKey(product, "primary")} product={product} />
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-gradient-to-r from-[#4270ff] via-[#6389ff] to-[#7aa2ff] px-7 py-8 text-white shadow-[0_20px_35px_rgba(57,101,255,0.24)]">
                <p className="text-sm font-semibold text-white/75">春季精選專題</p>
                <h2 className="mt-2 text-3xl font-bold">限時 5 折優惠</h2>
                <p className="mt-2 max-w-xl text-sm text-white/85">
                  多款熱賣商品同步補貨，部分品項支援 24H 到貨。
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#2147d1]"
                >
                  查看專題
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {lowerGridItems.map((product) => (
                  <ProductCard
                    key={getProductListKey(product, "secondary")}
                    product={product}
                    compact
                  />
                ))}
              </div>

              <div className="flex justify-center rounded-lg bg-white/70 px-4 py-4">
                <Pagination
                  color="primary"
                  count={data?.totalPages ?? 1}
                  page={filters.page}
                  onChange={(_event, page) => {
                    patchFilters({ page });
                    scrollToTop();
                    logEvent({ action: "page_change", target: String(page), label: `page-${page}` });
                  }}
                />
              </div>
            </div>

            <aside className="min-w-0 space-y-4">
              {adCards.map((card) => (
                <div
                  key={card.title}
                  className={`rounded-lg bg-gradient-to-br ${card.accent} p-5 text-white shadow-[0_18px_30px_rgba(31,50,91,0.12)]`}
                >
                  <p className="text-xs font-semibold text-white/80">{card.title}</p>
                  <h3 className="mt-2 text-3xl font-bold">{card.subtitle}</h3>
                  <p className="mt-1 text-sm text-white/80">{card.body}</p>
                </div>
              ))}

              <div className="glass-panel rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900">你可能也喜歡</h3>
                <div className="mt-3 space-y-3">
                  {spotlightProducts.map((product) => (
                    <SpotlightCard
                      key={getProductListKey(product, "spotlight")}
                      product={product}
                    />
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900">最近關注</h3>
                <div className="mt-3 space-y-3">
                  {items.slice(3, 5).map((product) => (
                    <SpotlightCard key={getProductListKey(product, "recent")} product={product} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <CartDrawer
        open={cartOpen}
        onOpenChange={(nextOpen) => {
          setCartOpen(nextOpen);
          logEvent({ action: nextOpen ? "cart_open" : "cart_close", target: "catalog-cart-drawer" });
        }}
      />
    </div>
  );
}

function SpotlightCard({ product }: { product: ProductRecord }) {
  const hasDiscount = product.originalPrice > product.price;

  return (
    <div className="flex min-w-0 gap-3 overflow-hidden rounded-lg border border-slate-200/70 bg-white/80 p-2">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-slate-100 px-2 text-center text-[10px] text-slate-500">
        圖片預留區
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-slate-800">{product.shortName}</p>
        <div className="mt-1 flex min-w-0 flex-col items-start gap-1">
          <span
            className={cn(
              "block max-w-full truncate text-sm font-bold",
              hasDiscount ? "text-[#ff5a36]" : "text-slate-900"
            )}
          >
            {formatPrice(product.price)}
          </span>
          <Rating value={product.rating} readOnly precision={0.5} size="small" className="max-w-full" />
        </div>
      </div>
    </div>
  );
}
