"use client";

import { useEffect, useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Slider from "@radix-ui/react-slider";
import Checkbox from "@mui/material/Checkbox";
import Rating from "@mui/material/Rating";
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
    <aside className="hidden h-fit w-[280px] shrink-0 xl:block">
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">篩選條件</h2>
          <button type="button" onClick={onReset} className="text-xs font-semibold text-[#3965ff]">
            重置
          </button>
        </div>

        <Accordion.Root
          type="multiple"
          defaultValue={showFeatureFilters ? ["price", "rating", "delivery", "features"] : ["price", "rating", "delivery"]}
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
                className="relative flex h-6 items-center"
              >
                <Slider.Track className="relative h-1.5 grow rounded-full bg-slate-200">
                  <Slider.Range className="absolute h-full rounded-full bg-[#3965ff]" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-white bg-[#3965ff] shadow" />
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-white bg-[#3965ff] shadow" />
              </Slider.Root>
              <div className="grid grid-cols-2 gap-2">
                <PriceInput
                  label="最低"
                  value={priceInputs[0]}
                  currentValue={visualPriceDraft[0]}
                  min={min}
                  max={visualPriceDraft[1]}
                  onDraftChange={(value) =>
                    setPriceInputs((current) => [value, current[1]])
                  }
                  onCommit={(value) => commitPriceRange(value, visualPriceDraft[1])}
                />
                <PriceInput
                  label="最高"
                  value={priceInputs[1]}
                  currentValue={visualPriceDraft[1]}
                  min={visualPriceDraft[0]}
                  max={max}
                  onDraftChange={(value) =>
                    setPriceInputs((current) => [current[0], value])
                  }
                  onCommit={(value) => commitPriceRange(visualPriceDraft[0], value)}
                />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="評分" value="rating">
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  type="button"
                  key={rating}
                  onClick={() => onChange({ minRating: filters.minRating === rating ? 0 : rating })}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm",
                    filters.minRating === rating
                      ? "bg-[#edf2ff] text-[#2147d1]"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Rating value={rating} readOnly size="small" />
                  <span className="text-xs">以上</span>
                </button>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="配送方式" value="delivery">
            <div className="space-y-1.5">
              {[
                { label: "全部", value: "all" as const, hint: "" },
                { label: "24H 到貨", value: "24h" as const, hint: "快速" },
                { label: "一般配送", value: "normal" as const, hint: "標準" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ delivery: option.value })}
                  className={cn(
                    "flex h-8 w-full items-center justify-between rounded-md px-3 text-sm transition",
                    filters.delivery === option.value
                      ? "bg-[#edf2ff] text-[#2147d1]"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <span>{option.label}</span>
                  <span className="text-[11px] text-slate-400">{option.hint}</span>
                </button>
              ))}
            </div>
          </AccordionSection>

          {showFeatureFilters ? (
            <AccordionSection title="商品特徵" value="features">
              <div className="space-y-4">
                {Object.entries(data?.availableFeatures ?? {}).map(([feature, values]) => (
                  <div key={feature}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {feature}
                    </p>
                    <div className="space-y-1">
                      {values.map((value) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
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
                  </div>
                ))}
              </div>
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
        <Accordion.Trigger className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-900">
          {title}
          <span className="text-slate-400">+</span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="px-5 pb-5">{children}</Accordion.Content>
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
    <label className="flex min-w-0 flex-col gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
      <span className="text-xs leading-5 text-slate-500">{label}</span>
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
        className="w-full min-w-0 border-0 bg-transparent text-right text-base tabular-nums outline-none"
      />
    </label>
  );
}
