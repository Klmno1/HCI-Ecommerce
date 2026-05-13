export type ProductRecord = {
  id: string;
  rawId: string;
  name: string;
  shortName: string;
  brand: string;
  description: string;
  tagline: string;
  detail: string;
  introduction: string;
  note: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  is24h: boolean;
  discountValue: number;
  discountLabel: string;
  searchKeyword: string;
  category: string;
  subcategory: string;
  sourceFile: string;
  imageText: string;
  imageUrl: string | null;
  features: Record<string, string>;
  featureOrder?: string[];
};

export type CategoryMapping = {
  category: string;
  keyword: string;
  outputCsv: string;
};

export type CatalogFilters = {
  search?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  delivery?: "all" | "24h" | "normal";
  featureFilters?: Record<string, string[]>;
  sort?: "price-asc" | "price-desc" | "popular";
  page?: number;
  pageSize?: number;
};

export type CatalogResponse = {
  items: ProductRecord[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  categories: { name: string; subcategories: string[] }[];
  availableFeatures: Record<string, string[]>;
  priceRange: { min: number; max: number };
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageText: string;
  imageUrl?: string | null;
  subcategory: string;
};
