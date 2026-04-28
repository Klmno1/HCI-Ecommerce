# HCI-Ecommerce

This project is a local CSV-driven ecommerce storefront built with `Next.js`, `Tailwind CSS`, `Radix UI`, and `Material UI`.

The current implementation focuses on:

- A storefront homepage with search, category/subcategory selection, filters, sorting, ads, pagination, and cart interactions
- A product detail page that keeps the same top header and category controls as the homepage
- Local CSV integration from `./db/Data`
- A reserved image pipeline so real product images can be connected later without redesigning the UI

## Tech Stack

- `Next.js` App Router
- `React`
- `Tailwind CSS`
- `Radix UI`
- `Material UI`
- `SWR` for client-side catalog fetching

## How the Site Works

### 1. Homepage

The homepage is the main shopping surface.

It includes:

- Header with logo, search bar, cart icon, and account icons
- Category dropdown and subcategory dropdown under the search area
- Left filter sidebar
- Product grid with 16 items per page
- Sorting controls
- Promotional blocks / ad sections
- Right-side recommendation panels
- Cart drawer

### 2. Category and Subcategory Selection

This does **not** live in the left filter panel.

Instead, it lives **under the main search bar** in the header.

The options come from:

- `db/Data/搜尋關鍵字_分類對照表.csv`

The structure is:

- `分類名稱` -> main category
- `搜尋關鍵字` -> subcategory
- `輸出CSV` -> source CSV file for that subcategory

When a user selects:

- `種類`: the storefront filters to that category
- `子種類`: the storefront filters to that exact subcategory

The selected state is reflected through URL query params on the homepage, so navigation is easier to preserve and reuse.

### 3. Search

Search uses partial / fuzzy-style matching through normalized text inclusion.

It is **not exact match**.

The search checks multiple fields such as:

- product name
- short name
- brand
- description
- tagline
- category
- subcategory
- search keyword
- feature values

### 4. Filters

The left sidebar always keeps:

- price range
- rating

Feature filters are shown **only when a category or subcategory is selected**.

This keeps the sidebar from becoming too long when browsing all products.

### 5. Sorting

Supported sorting modes:

- recommended
- price ascending
- price descending
- popular

Popular is currently based on:

- `評論數量`

### 6. Product Cards

Each product card:

- can be clicked anywhere to enter the product detail page
- has a cart button in the upper-right corner
- shows rating, review count, subcategory, and 24H tag when applicable

Discount logic:

- If `售價 === 原價`, the product is treated as **no discount**
- In that case:
  - no discount badge is shown
  - no strikethrough original price is shown
  - price uses normal dark text instead of discount red

If there is a discount:

- the discount label uses the CSV `discounts` multiplier as `?折`
- for example:
  - `0.8` -> `8折`
  - `0.95` -> `9.5折`

### 7. Product Detail Page

The product detail page keeps:

- the same header
- the same category / subcategory controls
- the same cart entry point

This page currently includes:

- product title
- price area
- rating
- feature/spec cards
- image placeholders
- CTA buttons
- extra promotional area

## Data Source

All product data currently comes from:

- `db/Data/*.csv`

The category mapping comes from:

- `db/Data/搜尋關鍵字_分類對照表.csv`

The expected common columns include:

- `搜尋關鍵字`
- `商品ID`
- `商品名稱`
- `簡化名稱`
- `品牌`
- `商品描述`
- `商品標語`
- `商品說明`
- `商品介紹`
- `備註資訊`
- `售價`
- `原價`
- `商品評分`
- `評論數量`
- `24H到貨`
- `discounts`

Any remaining columns are treated as dynamic product features.

## Image Strategy

Right now the UI uses text placeholders for images.

The image integration path is already reserved.

### Current Behavior

If no matching image is found:

- the UI shows placeholder text

If an image is found:

- the product will receive an `imageUrl`
- the API can serve it from local storage

### Where to Put Images

Place images under:

- `db/Data/images`

### Naming Convention

Image files should start with the product ID.

For example:

```text
DYAWDU-A900J425G-1.png
DYAWDU-A900J425G-main.jpg
```

The backend will detect the first matching file that starts with the product ID.

### Image API

The local image serving route is:

- `app/api/product-images/[...path]/route.ts`

## Important File Structure

### App Routes

- `app/page.tsx`
  - storefront homepage
- `app/products/[id]/page.tsx`
  - product detail page
- `app/not-found.tsx`
  - fallback page

### API Routes

- `app/api/catalog/route.ts`
  - returns filtered catalog data
- `app/api/catalog/meta/route.ts`
  - returns catalog metadata
- `app/api/products/[id]/route.ts`
  - returns a single product
- `app/api/product-images/[...path]/route.ts`
  - serves local product images

### Core UI Components

- `components/layout/site-header.tsx`
  - top navigation, search, category select, subcategory select, cart entry
- `components/catalog/catalog-shell.tsx`
  - homepage client logic and page composition
- `components/catalog/filter-sidebar.tsx`
  - price/rating/feature filter sidebar
- `components/catalog/cart-drawer.tsx`
  - cart panel with quantity control and removal
- `components/product/product-card.tsx`
  - clickable product card
- `components/product/product-detail-shell.tsx`
  - product detail page UI shell
- `components/product/add-to-cart-button.tsx`
  - reusable add-to-cart button

### Providers

- `components/providers/theme-provider.tsx`
  - Material UI theme setup
- `components/providers/cart-provider.tsx`
  - cart state, localStorage persistence, quantity math

### Data / Utility Layer

- `lib/catalog.ts`
  - CSV loading, mapping, filtering, sorting, pagination, feature extraction
- `lib/csv.ts`
  - CSV parser
- `lib/types.ts`
  - shared TypeScript types
- `lib/utils.ts`
  - formatting and text normalization helpers

## Component Responsibilities

### `SiteHeader`

Handles:

- logo rendering
- search input
- search submit
- category dropdown
- subcategory dropdown
- cart button

This component is shared by:

- homepage
- product detail page

### `CatalogShell`

Handles:

- reading and syncing query params
- homepage state
- catalog fetching
- sorting
- pagination
- wiring filter changes to route state
- ad / recommendation layout

### `FilterSidebar`

Handles:

- price slider
- rating options
- feature filters
- hiding feature filters when no category is selected

### `ProductCard`

Handles:

- full-card navigation
- cart button behavior
- discount badge rules
- price display rules

### `ProductDetailShell`

Handles:

- consistent shared header on detail page
- routing back to catalog
- detail layout
- feature rendering

## URL Query Behavior

The homepage uses query params so filter state can be preserved in the URL.

Examples:

```text
/?category=3C
/?category=3C&subcategory=手機
/?search=iphone
/?category=3C&subcategory=手機&sort=popular&page=2
```

Supported query params:

- `search`
- `category`
- `subcategory`
- `minPrice`
- `maxPrice`
- `minRating`
- `featureFilters`
- `sort`
- `page`

## Important Commands

### Install dependencies

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
```

### Start dev server

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev -- --hostname 127.0.0.1 --port 3000
```

### Production build

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build
```

### Start production server

```powershell
& "C:\Program Files\nodejs\npm.cmd" run start
```

## Notes About the Local Environment

In this workspace, `npm` was available through:

```text
C:\Program Files\nodejs\npm.cmd
```

So if plain `npm` does not resolve in a shell, use the full path command above.

## Current Design Decisions

- Homepage and product page use the same top header
- Category/subcategory selection is in the header, not the left sidebar
- Feature filters are hidden until a category context exists
- Product image support is reserved but not visually finalized
- Ads are currently custom UI content and can be changed freely

## Suggested Next Steps

- Replace placeholder image areas with real image components
- Add mobile filter drawer
- Add checkout page / order flow
- Add recently viewed persistence
- Add wishlist / favorites
- Improve recommendation logic
- Add server-side caching for large CSV catalogs if the dataset grows
