# HCI-Ecommerce

This project is a local CSV-driven ecommerce storefront built with `Next.js`, `Tailwind CSS`, `Radix UI`, `Material UI`, and `SWR`.

## Current Implementation

- ~~A storefront homepage with search, category/subcategory selection, filters, sorting, ads, pagination, and cart interactions~~
  -> A storefront homepage with search, category/subcategory selection, price/rating/delivery/feature filters, sorting, ads, pagination, cart interactions, and right-side recommendation panels that stay inside their layout.
- ~~A product detail page that keeps the same top header and category controls as the homepage~~
  -> A product detail page that keeps the same top header and category controls as the homepage, including fixed category/subcategory routing behavior.
- Local CSV integration from `./db/Data`
- A reserved image pipeline so real product images can be connected later without redesigning the UI

## How The Site Works

### 1. Homepage

The homepage is the main shopping surface.

It includes:

- Header with logo, search bar, cart icon, and account icons
- ~~Category dropdown and subcategory dropdown under the search area~~
  -> Desktop uses a horizontal category bar with a hover subcategory menu; smaller screens keep category/subcategory dropdowns.
- ~~Left filter sidebar~~
  -> Left filter sidebar with price, rating, delivery, and dynamic feature filters.
- Product grid with 16 items per page
- Sorting controls
- Promotional blocks / ad sections
- ~~Right-side recommendation panels~~
  -> Right-side recommendation panels with constrained card width so long product text does not overflow the frame.
- Cart drawer

### 2. Category And Subcategory Selection

This does **not** live in the left filter panel.

- ~~Instead, it lives under the main search bar in the header.~~
  -> Desktop category selection lives in the horizontal header bar, with subcategories shown in the hover menu. Mobile keeps compact dropdown controls.
- ~~Main category selection only filters to that category.~~
  -> Main category selection clears the previous subcategory and dynamic feature filters.
- ~~Subcategory selection only filters to that exact subcategory.~~
  -> Subcategory selection updates category and subcategory together, so an old subcategory cannot remain attached to the wrong main category.
- If a URL contains an invalid category/subcategory pair, the page clears the mismatched subcategory automatically.
- When hovering another category in the desktop header, only the hovered category is highlighted. The currently selected URL category is not highlighted at the same time.

The selected state is reflected through URL query params on the homepage, so navigation is easier to preserve and reuse.

### 3. Search

Search uses partial matching through normalized text inclusion.

It is **not exact match**.

- ~~Search checks product name, short name, brand, description, tagline, category, subcategory, search keyword, and feature values.~~
  -> Search now checks only product name, category, subcategory, and dynamic feature values.

### 4. Filters

- ~~The left sidebar always keeps price range and rating.~~
  -> The left sidebar keeps price range, rating, and delivery method.
- Feature filters are shown **only when a category or subcategory is selected**.
- ~~The filter sidebar stays sticky while scrolling.~~
  -> The filter sidebar now scrolls naturally with the page.
- The rating filter is more compact, leaving room for the delivery filter below it.

Supported delivery filters:

- `all`
- `24h`
- `normal`

### 5. Sorting

Supported sorting modes:

- `recommended`
- `price-asc`
- `price-desc`
- `popular`

Popular sorting is currently based on review count.

### 6. Product Cards

Each product card:

- can be clicked anywhere to enter the product detail page
- has a cart button in the upper-right corner
- shows rating, review count, subcategory, and 24H tag when applicable

Discount logic:

- If `price === originalPrice`, the product is treated as **no discount**
- In that case:
  - no discount badge is shown
  - no strikethrough original price is shown
  - price uses normal dark text instead of discount red

If there is a discount:

- the discount label uses the CSV `discounts` multiplier
- for example:
  - `0.8` -> `8折`
  - `0.95` -> `9.5折`

### 7. Cart Drawer

- ~~Cart items only supported quantity changes and removal inside the cart drawer.~~
  -> Cart drawer items can also link directly to the product detail page.
- Cart state is persisted in `localStorage`.
- Quantity changes update the total amount immediately.

### 8. Product Detail Page

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
- `商品規格`
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

If no matching image is found:

- the UI shows placeholder text

If an image is found:

- the product will receive an `imageUrl`
- the API can serve it from local storage

Place images under:

- `db/Data/images`

Image files should start with the product ID.

For example:

```text
DYAWDU-A900J425G-1.png
DYAWDU-A900J425G-main.jpg
```

The backend will detect the first matching file that starts with the product ID.

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
  - top navigation, search, category controls, subcategory controls, cart entry
- `components/catalog/catalog-shell.tsx`
  - homepage client logic and page composition
- `components/catalog/filter-sidebar.tsx`
  - price/rating/delivery/feature filter sidebar
- `components/catalog/cart-drawer.tsx`
  - cart panel with product links, quantity control, and removal
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

## URL Query Behavior

The homepage uses query params so filter state can be preserved in the URL.

Examples:

```text
/?category=3C
/?category=3C&subcategory=手機
/?search=iphone
/?category=3C&subcategory=手機&sort=popular&page=2
/?category=居家用品&delivery=24h
```

Supported query params:

- `search`
- `category`
- `subcategory`
- `minPrice`
- `maxPrice`
- `minRating`
- `delivery`
- `featureFilters`
- `sort`
- `page`

## Commands

These commands are generic project commands.

### Windows full npm path

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev -- --hostname 127.0.0.1 --port 3000
& "C:\Program Files\nodejs\npm.cmd" run build
& "C:\Program Files\nodejs\npm.cmd" run start
```

### Standard npm commands

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

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
