"use client";

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
  const sliderValue: [number, number] = [filters.minPrice ?? min, filters.maxPrice ?? max];
  const showFeatureFilters = Boolean(filters.category || filters.subcategory);

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
                value={sliderValue}
                min={min}
                max={max}
                step={100}
                minStepsBetweenThumbs={1}
                onValueCommit={(values) => onChange({ minPrice: values[0], maxPrice: values[1] })}
                className="relative flex h-6 items-center"
              >
                <Slider.Track className="relative h-1.5 grow rounded-full bg-slate-200">
                  <Slider.Range className="absolute h-full rounded-full bg-[#3965ff]" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-white bg-[#3965ff] shadow" />
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-white bg-[#3965ff] shadow" />
              </Slider.Root>
              <div className="flex gap-2">
                <PriceInput value={filters.minPrice ?? min} label="最低" />
                <PriceInput value={filters.maxPrice ?? max} label="最高" />
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
                { label: "全部", value: "all" as const },
                { label: "24H 到貨", value: "24h" as const },
                { label: "一般配送", value: "normal" as const }
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
                  <span className="text-[11px] text-slate-400">
                    {option.value === "24h" ? "快速" : option.value === "normal" ? "標準" : ""}
                  </span>
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

function PriceInput({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
