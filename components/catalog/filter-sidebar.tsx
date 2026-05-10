"use client";

import { useEffect, useState, type ReactNode } from "react";
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

  const clampPrice = (value: number, lower: number, upper: number) =>
    Math.min(Math.max(value, lower), upper);

  const parsePriceInput = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const normalizedMinPrice =
    typeof filters.minPrice === "number" ? clampPrice(filters.minPrice, min, max) : min;
  const normalizedMaxPrice =
    typeof filters.maxPrice === "number" ? clampPrice(filters.maxPrice, min, max) : max;

  const [priceDraft, setPriceDraft] = useState<[number, number]>(() => [
    normalizedMinPrice,
    normalizedMaxPrice
  ]);
  const [priceInputs, setPriceInputs] = useState<[string, string]>(() => [
    typeof filters.minPrice === "number" ? String(filters.minPrice) : "",
    typeof filters.maxPrice === "number" ? String(filters.maxPrice) : ""
  ]);
  const [priceTouched, setPriceTouched] = useState<[boolean, boolean]>(() => [
    typeof filters.minPrice === "number",
    typeof filters.maxPrice === "number"
  ]);

  const showFeatureFilters = Boolean(filters.category || filters.subcategory);

  useEffect(() => {
    setPriceDraft([normalizedMinPrice, normalizedMaxPrice]);
    setPriceTouched([
      typeof filters.minPrice === "number",
      typeof filters.maxPrice === "number"
    ]);
    setPriceInputs([
      typeof filters.minPrice === "number" ? String(filters.minPrice) : "",
      typeof filters.maxPrice === "number" ? String(filters.maxPrice) : ""
    ]);
  }, [normalizedMinPrice, normalizedMaxPrice, filters.minPrice, filters.maxPrice]);

  const getNextSliderState = (
    nextValues: [number, number],
    previousDraft: [number, number],
    previousTouched: [boolean, boolean]
  ) => {
    const nextDraft: [number, number] = [
      clampPrice(nextValues[0], min, max),
      clampPrice(nextValues[1], min, max)
    ];
    const minChanged = nextDraft[0] !== previousDraft[0];
    const maxChanged = nextDraft[1] !== previousDraft[1];
    const nextTouched: [boolean, boolean] = [...previousTouched];

    if (minChanged) {
      nextTouched[0] = nextDraft[0] !== min;
    }

    if (maxChanged) {
      nextTouched[1] = nextDraft[1] !== max;
    }

    const nextInputs: [string, string] = [
      nextTouched[0] ? String(nextDraft[0]) : "",
      nextTouched[1] ? String(nextDraft[1]) : ""
    ];

    return { nextDraft, nextTouched, nextInputs };
  };

  const applyTypedPriceRange = (nextMin?: number, nextMax?: number) => {
    const hasMin = typeof nextMin === "number";
    const hasMax = typeof nextMax === "number";

    setPriceDraft([
      hasMin ? clampPrice(nextMin, min, max) : min,
      hasMax ? clampPrice(nextMax, min, max) : max
    ]);
    setPriceTouched([hasMin, hasMax]);
    setPriceInputs([hasMin ? String(nextMin) : "", hasMax ? String(nextMax) : ""]);

    onChange({
      minPrice: hasMin ? nextMin : undefined,
      maxPrice: hasMax ? nextMax : undefined
    });
  };

  const applySliderPriceRange = (nextValues: [number, number]) => {
    const { nextDraft, nextTouched, nextInputs } = getNextSliderState(
      nextValues,
      priceDraft,
      priceTouched
    );

    setPriceDraft(nextDraft);
    setPriceTouched(nextTouched);
    setPriceInputs(nextInputs);

    onChange({
      minPrice: nextTouched[0] ? nextDraft[0] : undefined,
      maxPrice: nextTouched[1] ? nextDraft[1] : undefined
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
                value={priceDraft}
                min={min}
                max={max}
                step={100}
                minStepsBetweenThumbs={1}
                onValueChange={(values) => {
                  const { nextDraft, nextTouched, nextInputs } = getNextSliderState(
                    [values[0], values[1]],
                    priceDraft,
                    priceTouched
                  );
                  setPriceDraft(nextDraft);
                  setPriceTouched(nextTouched);
                  setPriceInputs(nextInputs);
                }}
                onValueCommit={(values) => applySliderPriceRange([values[0], values[1]])}
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
                  onDraftChange={(value) => setPriceInputs((current) => [value, current[1]])}
                  onCommit={(value) =>
                    applyTypedPriceRange(value, parsePriceInput(priceInputs[1]))
                  }
                />
                <PriceInput
                  label="最高"
                  value={priceInputs[1]}
                  onDraftChange={(value) => setPriceInputs((current) => [current[0], value])}
                  onCommit={(value) =>
                    applyTypedPriceRange(parsePriceInput(priceInputs[0]), value)
                  }
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
                </button>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="配送選項" value="delivery">
            <div className="space-y-2">
              {[
                { label: "全部配送", value: "all" as const, hint: "" },
                { label: "24H 到貨", value: "24h" as const, hint: "最快" },
                { label: "一般配送", value: "normal" as const, hint: "常規" }
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
                  {option.hint ? (
                    <span
                      className={cn(
                        "text-xs",
                        filters.delivery === option.value ? "text-[#6f87d8]" : "text-slate-400"
                      )}
                    >
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </AccordionSection>

          {showFeatureFilters ? (
            <AccordionSection title="商品特徵" value="features">
              <Accordion.Root type="multiple" defaultValue={[]} className="space-y-3">
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
  children: ReactNode;
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
  onDraftChange,
  onCommit
}: {
  label: string;
  value: string;
  onDraftChange: (value: string) => void;
  onCommit: (value: number | undefined) => void;
}) {
  const commitValue = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === "") {
      onCommit(undefined);
      return;
    }

    const next = Number(rawValue);
    onCommit(Number.isFinite(next) ? next : undefined);
  };

  return (
    <label className="flex min-w-0 flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
      <span className="text-xs leading-5 text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">NT$</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => onDraftChange(event.target.value.replace(/[^0-9]/g, ""))}
          onBlur={(event) => commitValue(event.currentTarget.value)}
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
