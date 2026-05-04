"use client";

import { useEffect, useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Slider from "@radix-ui/react-slider";
import Checkbox from "@mui/material/Checkbox";
import Rating from "@mui/material/Rating";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import type { CatalogResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterSidebarProps = {
  data?: CatalogResponse;
  filters: {
    category: string;
    subcategory: string;
    minPrice?: number;
    maxPrice?: number;
    minRating: number;
    delivery: "all" | "24h" | "normal";
    featureFilters: Record<string, string[]>;
  };
  onChange: (
    next: Partial<{
      minPrice?: number;
      maxPrice?: number;
      minRating: number;
      delivery: "all" | "24h" | "normal";
      featureFilters: Record<string, string[]>;
    }>
  ) => void;
  onReset: () => void;
};

export function FilterSidebar({ data, filters, onChange, onReset }: FilterSidebarProps) {
  const min = data?.priceRange.min ?? 0;
  const max = data?.priceRange.max ?? 20000;

  const clampPrice = (value: number, lower: number, upper: number) => {
    if (!Number.isFinite(value)) {
      return lower;
    }
    return Math.min(Math.max(value, lower), upper);
  };

  const normalizePriceDraft = (nextMin?: number, nextMax?: number): [number, number] => {
    const boundedMin = clampPrice(nextMin ?? min, min, max);
    const boundedMax = clampPrice(nextMax ?? max, min, max);
    return boundedMin <= boundedMax ? [boundedMin, boundedMax] : [boundedMax, boundedMin];
  };

  const [priceDraft, setPriceDraft] = useState<[number, number]>(() =>
    normalizePriceDraft(filters.minPrice, filters.maxPrice)
  );
  const [priceInputs, setPriceInputs] = useState<[string, string]>([
    String(normalizePriceDraft(filters.minPrice, filters.maxPrice)[0]),
    String(normalizePriceDraft(filters.minPrice, filters.maxPrice)[1])
  ]);

  const showFeatureFilters = Boolean(filters.category || filters.subcategory);
  const visualPriceDraft = normalizePriceDraft(priceDraft[0], priceDraft[1]);

  useEffect(() => {
    const [nextMin, nextMax] = normalizePriceDraft(filters.minPrice, filters.maxPrice);
    setPriceDraft([nextMin, nextMax]);
    setPriceInputs([String(nextMin), String(nextMax)]);
  }, [filters.minPrice, filters.maxPrice, min, max]);

  const commitPriceRange = (nextMin: number, nextMax: number) => {
    const boundedMin = clampPrice(nextMin, min, max);
    const boundedMax = clampPrice(nextMax, min, max);
    const normalizedMin = Math.min(boundedMin, boundedMax);
    const normalizedMax = Math.max(boundedMin, boundedMax);

    setPriceDraft([normalizedMin, normalizedMax]);
    setPriceInputs([String(normalizedMin), String(normalizedMax)]);
    onChange({
      minPrice: normalizedMin,
      maxPrice: normalizedMax
    });
  };

  const handleFeatureToggle = (feature: string, value: string, checked: boolean) => {
    const current = filters.featureFilters[feature] ?? [];
    const nextValues = checked ? [...current, value] : current.filter((item) => item !== value);
    const nextFilters = {
      ...filters.featureFilters,
      [feature]: nextValues
    };

    if (nextValues.length === 0) {
      delete nextFilters[feature];
    }

    onChange({ featureFilters: nextFilters });
  };

  return (
    <aside className="hidden h-fit w-[320px] shrink-0 xl:block">
      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">篩選條件</h2>
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            重置
          </button>
        </div>

        <Accordion.Root
          type="multiple"
          defaultValue={
            showFeatureFilters
              ? ["price", "rating", "delivery", "features"]
              : ["price", "rating", "delivery"]
          }
          className="divide-y divide-slate-200/80"
        >
          <AccordionSection title="價格範圍" value="price">
            <div className="space-y-4">
              <Slider.Root
                value={visualPriceDraft}
                min={min}
                max={max}
                step={100}
                minStepsBetweenThumbs={1}
                onValueChange={(values) =>
                  setPriceDraft([
                    clampPrice(values[0], min, max),
                    clampPrice(values[1], min, max)
                  ])
                }
                onValueCommit={(values) => commitPriceRange(values[0], values[1])}
                className="relative flex h-6 items-center touch-none select-none"
              >
                <Slider.Track className="relative h-2 grow rounded-full bg-slate-200">
                  <Slider.Range className="absolute h-full rounded-full bg-[#3965ff]" />
                </Slider.Track>
                <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-[#3965ff] shadow" />
                <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-[#3965ff] shadow" />
              </Slider.Root>
              <div className="grid grid-cols-2 gap-3">
                <PriceInput
                  label="最低"
                  value={priceInputs[0]}
                  currentValue={visualPriceDraft[0]}
                  min={min}
                  max={visualPriceDraft[1]}
                  onDraftChange={(value) => setPriceInputs((current) => [value, current[1]])}
                  onCommit={(value) => commitPriceRange(value, visualPriceDraft[1])}
                />
                <PriceInput
                  label="最高"
                  value={priceInputs[1]}
                  currentValue={visualPriceDraft[1]}
                  min={visualPriceDraft[0]}
                  max={max}
                  onDraftChange={(value) => setPriceInputs((current) => [current[0], value])}
                  onCommit={(value) => commitPriceRange(visualPriceDraft[0], value)}
                />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="評分" value="rating">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  type="button"
                  key={rating}
                  onClick={() => onChange({ minRating: filters.minRating === rating ? 0 : rating })}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium",
                    filters.minRating === rating
                      ? "border border-[#cdd8f8] bg-[#eef3ff] text-[#355cc8] shadow-[inset_0_0_0_1px_rgba(53,92,200,0.04)]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Rating value={rating} readOnly size="small" />
                  <span>{rating} 星以上</span>
                  {filters.minRating === rating ? (
                    <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[#86a0ea]" />
                  ) : null}
                </button>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="到貨時間" value="delivery">
            <div className="space-y-2">
              {[
                { label: "全部商品", value: "all" as const, hint: "" },
                { label: "24H 到貨", value: "24h" as const, hint: "快速" },
                { label: "一般配送", value: "normal" as const, hint: "標準" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ delivery: option.value })}
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm font-medium transition",
                    filters.delivery === option.value
                      ? "border border-[#cdd8f8] bg-[#eef3ff] text-[#355cc8] shadow-[inset_0_0_0_1px_rgba(53,92,200,0.04)]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span>{option.label}</span>
                  <span
                      className={cn(
                        "text-xs",
                        filters.delivery === option.value ? "text-[#6f87d8]" : "text-slate-400"
                      )}
                    >
                      {option.hint}
                    </span>
                </button>
              ))}
            </div>
          </AccordionSection>

          {showFeatureFilters ? (
            <AccordionSection title="商品特徵" value="features">
              <Accordion.Root
                type="multiple"
                defaultValue={[]}
                className="space-y-3"
              >
                {Object.entries(data?.availableFeatures ?? {}).map(([feature, values]) => (
                  <Accordion.Item
                    key={feature}
                    value={feature}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70"
                  >
                    <Accordion.Header>
                      <Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-left">
                        <span className="text-sm font-semibold text-slate-800">{feature}</span>
                        <span className="rounded-full bg-white p-1 text-slate-500 transition group-data-[state=open]:rotate-180 group-data-[state=open]:bg-[#edf2ff] group-data-[state=open]:text-[#2147d1]">
                          <KeyboardArrowDownRoundedIcon fontSize="small" />
                        </span>
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="border-t border-slate-200 bg-white px-4 py-3">
                      <div className="space-y-1">
                        {values.map((value) => (
                          <label
                            key={value}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-sm transition",
                              (filters.featureFilters[feature] ?? []).includes(value)
                                ? "border-[#d8e1fb] bg-[#f5f8ff] text-[#355cc8]"
                                : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <Checkbox
                              size="small"
                              checked={(filters.featureFilters[feature] ?? []).includes(value)}
                              onChange={(event) =>
                                handleFeatureToggle(feature, value, event.target.checked)
                              }
                            />
                            <span className="line-clamp-1">{value}</span>
                          </label>
                        ))}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </AccordionSection>
          ) : null}
        </Accordion.Root>
      </div>
    </aside>
  );
}

function AccordionSection({
  title,
  value,
  children
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Header>
        <Accordion.Trigger className="group flex w-full items-center justify-between px-6 py-5 text-left">
          <span className="text-base font-semibold text-slate-900">{title}</span>
          <span className="rounded-full bg-slate-100 p-1 text-slate-500 transition group-data-[state=open]:rotate-180 group-data-[state=open]:bg-[#edf2ff] group-data-[state=open]:text-[#2147d1]">
            <KeyboardArrowDownRoundedIcon fontSize="small" />
          </span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="px-6 pb-6">{children}</Accordion.Content>
    </Accordion.Item>
  );
}

function PriceInput({
  label,
  value,
  currentValue,
  min,
  max,
  onDraftChange,
  onCommit
}: {
  label: string;
  value: string;
  currentValue: number;
  min: number;
  max: number;
  onDraftChange: (value: string) => void;
  onCommit: (value: number) => void;
}) {
  const commitValue = (rawValue: string, fallbackValue: number) => {
    if (rawValue.trim() === "") {
      onCommit(fallbackValue);
      return;
    }

    const next = Number(rawValue);
    if (Number.isFinite(next)) {
      onCommit(next);
    }
  };

  return (
    <label className="flex min-w-0 flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
      <span className="text-xs leading-5 text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">NT$</span>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          onChange={(event) => {
            onDraftChange(event.target.value);
          }}
          onBlur={(event) => commitValue(event.currentTarget.value, currentValue)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="w-full min-w-0 border-0 bg-transparent text-right text-lg font-semibold tabular-nums text-slate-900 outline-none"
        />
      </div>
    </label>
  );
}
