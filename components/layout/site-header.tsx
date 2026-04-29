"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, FormControl, IconButton, InputLabel, MenuItem, Select } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/utils";

type HeaderCategory = {
  name: string;
  subcategories: string[];
};

type SiteHeaderProps = {
  search: string;
  categories: HeaderCategory[];
  selectedCategory: string;
  selectedSubcategory: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onCartOpen: () => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
};

export function SiteHeader({
  search,
  categories,
  selectedCategory,
  selectedSubcategory,
  onSearchChange,
  onSearchSubmit,
  onCartOpen,
  onCategoryChange,
  onSubcategoryChange
}: SiteHeaderProps) {
  const { totalQuantity } = useCart();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const openCategory = hoveredCategory;
  const openSubcategories = useMemo(
    () => categories.find((category) => category.name === openCategory)?.subcategories ?? [],
    [categories, openCategory]
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/logo-3.png" alt="YOUDE" width={102} height={32} priority />
        </Link>

        <div className="hidden flex-1 items-center gap-3 md:flex">
          <div className="flex h-12 flex-1 items-center overflow-hidden rounded-lg border border-[#3965ff] bg-white shadow-sm">
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSearchSubmit();
                }
              }}
              placeholder="搜尋商品、品牌..."
              className="h-full flex-1 border-0 px-4 text-sm outline-none"
            />
            <button
              type="button"
              onClick={onSearchSubmit}
              className="flex h-full w-14 items-center justify-center bg-[#3965ff] text-white transition hover:bg-[#2147d1]"
            >
              <SearchRoundedIcon fontSize="small" />
            </button>
          </div>

          <button
            type="button"
            className="hidden h-12 min-w-[260px] items-center justify-center rounded-lg bg-gradient-to-r from-[#4b7bff] to-[#6b8cff] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(57,101,255,0.22)] xl:flex"
          >
            春季精選專題
            <span className="ml-2 rounded-full bg-white/20 px-2 py-1 text-xs">折扣與補貨同步更新</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <IconButton onClick={onCartOpen} aria-label="購物車">
            <Badge color="primary" badgeContent={totalQuantity}>
              <ShoppingCartOutlinedIcon />
            </Badge>
          </IconButton>
          <IconButton aria-label="會員中心">
            <PersonOutlineRoundedIcon />
          </IconButton>
          <IconButton aria-label="更多功能">
            <ExpandMoreRoundedIcon />
          </IconButton>
        </div>

        <div className="flex w-full items-center overflow-hidden rounded-lg border border-[#3965ff] bg-white shadow-sm md:hidden">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearchSubmit();
              }
            }}
            placeholder="搜尋商品、品牌..."
            className="h-11 flex-1 border-0 px-4 text-sm outline-none"
          />
          <button
            type="button"
            onClick={onSearchSubmit}
            className="flex h-11 w-12 items-center justify-center bg-[#3965ff] text-white"
          >
            <SearchRoundedIcon fontSize="small" />
          </button>
        </div>
      </div>

      <div
        className="relative border-t border-slate-200/80 bg-[#474747] text-white"
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <div className="mx-auto hidden max-w-[1440px] xl:block">
          <div className="flex items-stretch">
            {categories.map((category) => {
              const isActive = category.name === selectedCategory;
              const isHovered = category.name === openCategory;

              return (
                <div
                  key={category.name}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(category.name)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onCategoryChange(category.name);
                      setHoveredCategory(null);
                    }}
                    className={cn(
                      "relative flex h-11 min-w-[96px] items-center justify-center px-6 text-lg font-semibold transition",
                      isActive || isHovered ? "bg-[#c73d7a]" : "bg-transparent hover:bg-[#5a5a5a]"
                    )}
                  >
                    {category.name}
                  </button>
                </div>
              );
            })}
          </div>

          {openCategory && openSubcategories.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-50 border-t border-slate-200 bg-white text-slate-900 shadow-[0_18px_35px_rgba(15,23,42,0.14)]">
              <div className="mx-auto grid max-w-[1440px] grid-cols-4 gap-0">
                {openSubcategories.map((subcategory) => {
                  const isSelected =
                    openCategory === selectedCategory && subcategory === selectedSubcategory;

                  return (
                    <button
                      key={`${openCategory}-${subcategory}`}
                      type="button"
                      onClick={() => {
                        onCategoryChange(openCategory);
                        onSubcategoryChange(subcategory);
                        setHoveredCategory(null);
                      }}
                      className={cn(
                        "border-r border-slate-200 px-5 py-4 text-left text-[15px] font-medium transition last:border-r-0 hover:bg-[#fff4f8] hover:text-[#c73d7a]",
                        isSelected && "bg-[#fff4f8] text-[#c73d7a]"
                      )}
                    >
                      {subcategory}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 xl:hidden">
          <FormControl size="small" className="bg-white">
            <InputLabel id="mobile-category-label">種類</InputLabel>
            <Select
              labelId="mobile-category-label"
              value={selectedCategory}
              label="種類"
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <MenuItem value="">全部種類</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.name} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="bg-white">
            <InputLabel id="mobile-subcategory-label">子種類</InputLabel>
            <Select
              labelId="mobile-subcategory-label"
              value={selectedSubcategory}
              label="子種類"
              onChange={(event) => onSubcategoryChange(event.target.value)}
              disabled={!selectedCategory}
            >
              <MenuItem value="">全部子種類</MenuItem>
              {(categories.find((category) => category.name === selectedCategory)?.subcategories ?? []).map(
                (subcategory) => (
                  <MenuItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </div>
      </div>
    </header>
  );
}
