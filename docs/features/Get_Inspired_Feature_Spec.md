# Get Inspired — Feature Architecture

> **Status:** Proof of concept complete
> **Last Updated:** 2026-02-10
> **Reference Implementation:** Solutions-Plus dev store

---

## What This Feature Is

A curated inspiration gallery that pairs lifestyle imagery with tagged products. Think Pinterest-meets-shop-the-look. Content editors create entries in the Shopify admin, each with a hero image, category, description, and product selections. Visitors browse a filterable masonry grid and click through to individual detail pages.

**Two views:**
- **Index page** — Filterable masonry grid with category tabs and progressive loading
- **Detail page** — Hero image, editorial content, product grid, and related entries

---

## System Overview

```
+---------------------------+
|   Shopify Admin (CMS)     |
|  Metaobject entries with  |
|  images, products, refs   |
+------------+--------------+
             |
    Liquid renders all
    entries server-side
             |
+------------+--------------+
|   Index Page               |
|  +---------+  +---------+ |
|  | Filter  |  | Masonry | |
|  | Tabs    |  | Grid    | |
|  +---------+  +---------+ |
|  JS handles filtering,    |
|  sorting, load-more       |
+------------+--------------+
             |
        Card links to
             |
+------------+--------------+
|   Detail Page              |
|  +-------+  +-----------+ |
|  | Sticky|  | Content   | |
|  | Hero  |  | + Products| |
|  +-------+  +-----------+ |
|  +------------------------+|
|  | Related Inspirations   ||
|  +------------------------+|
+---------------------------+
```

---

## Components

### 1. Metaobject Definition

The data layer is a custom Shopify metaobject. This is the content type that editors interact with in the admin.

**Required capabilities:**
- **Publishable** — Draft/active workflow for content management
- **Renderable** — SEO meta title and description sourced from entry fields
- **Online Store** — Each entry gets its own URL and uses a theme template

**Core fields (adapt to client requirements):**

| Concept | Field Type | Notes |
|---------|-----------|-------|
| Title | Single-line text | Display name, used for SEO title |
| Category | Single-line text with choices validation | Powers filter tabs on index page. Values must match exactly between definition, Liquid, and JS. |
| Description | Rich text | Editorial body content on detail page |
| Hero image | File reference (image) | Primary visual for both card and detail page |
| Products | List of product references | Tagged products shown as thumbnails on cards and full grid on detail page |
| Related entries | List of metaobject references (self-referencing) | Curated "you may also like" row on detail page |

**Important gotcha:** Self-referencing fields (a metaobject referencing its own type) cannot be included in the initial `metaobjectDefinitionCreate` mutation. The definition must be created first, then updated with the self-referencing field in a second mutation.

**Another gotcha:** The `onlineStore` capability is not supported in TOML metaobject config files. The definition must be created via GraphQL Admin API.

### 2. Theme Templates

Two JSON templates wire sections to pages:

**Index page template** (`templates/page.{handle}.json`)
- Custom page template assigned to a Page in the admin
- Contains the grid section
- Route: `/pages/{page-handle}`

**Detail page template** (`templates/metaobject/{type}.json`)
- Auto-applied to all published entries of the metaobject type
- Contains hero section + related entries section
- Route: `/pages/{url-handle}/{entry-handle}` (URL handle set in metaobject definition)
- The `templates/metaobject/` directory may not exist in a fresh theme — needs to be created

### 3. Shared Card Component

A snippet rendered in both the index grid and the related entries row. Shows:
- Hero image (responsive, lazy-loaded)
- Product thumbnail swatches (first N products + overflow count badge)
- Title and category label
- Links to the entry's detail page

The card carries a `data-category` attribute for client-side filtering.

### 4. Index Page Section

The most architecturally interesting piece. Combines server-rendered Liquid with client-side JS.

**Liquid responsibilities:**
- Render page header (heading, description)
- Render category filter tab buttons
- Iterate all metaobject entries via `shop.metaobjects.{type}.values` (paginated to 250) and render each card into a hidden pool div
- Include the compiled JS file

**JS responsibilities:**
- Sort entries newest-first by metaobject GID (see Architecture Notes below)
- Distribute cards across flex columns in a round-robin pattern
- Apply aspect-ratio size classes per column position for the mosaic effect
- Handle filter tab clicks: re-filter the card set and redistribute
- Handle load-more: reveal next batch from filtered set
- Handle responsive resize: switch between 4-column desktop and 2-column mobile layouts

### 5. Detail Page Sections

**Hero section:**
- Two-column layout on desktop (sticky image left, content right), stacked on mobile
- Content includes: back link to index, title, category, rich text description, and product grid
- Product grid is embedded within the hero content column (not a separate section)
- Each product card: square image, vendor/metadata label, product name (truncated to 2 lines), subtitle field

**Related entries section:**
- Horizontally scrollable row of cards using the shared card component
- Conditionally hidden when no related entries are linked
- Fixed card widths to maintain consistent sizing during horizontal scroll

### 6. Client-Side JavaScript

Single IIFE file, no framework dependencies, compiled via esbuild.

**Key behaviors:**
- **Sorting:** Extracts numeric metaobject GID from `data-entry-id` attributes and sorts descending
- **Filtering:** Reads `data-category` from each card's link element, compares against the active filter tab's value (both handleized)
- **Masonry:** Round-robin distribution across N columns, with per-column aspect-ratio class cycling for visual variety
- **Load more:** Tracks visible count, reveals next batch, hides button when all shown
- **Responsive:** Listens for resize, re-distributes when column count changes at breakpoint

---

## Layout Patterns

### Masonry Grid

Not CSS masonry — uses N flex columns with round-robin card distribution. Each column has a repeating pattern of aspect-ratio size classes that cycle to create visual variety. The patterns are deterministic (based on card index and column position), not content-aware.

**Size classes define image aspect ratios only** — the card body (swatches, title, category) stays the same height across all sizes. Four sizes in the proof of concept, but the count and ratios are adjustable.

### Full-Width Background with Constrained Content

All sections use a two-div wrapper pattern:
- Outer div: spans full viewport width, carries the background color
- Inner div: constrained to `max-width` with auto margins, carries the content padding

This prevents background color gaps when the viewport is wider than the content area.

### Sticky Hero Image

On the detail page, the hero image uses `position: sticky` so it remains visible while the user scrolls through the product grid. The `top` offset must account for any sticky header in the theme (use the theme's header height CSS variable if available).

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Metaobjects over blogs/collections/pages | Clean semantic data model, native product references, standalone content type with its own URL routing |
| Client-side filtering over server-side | Storefront API does not support field-level filtering on metaobjects. Under 250 entries, client-side is fast and avoids custom app infrastructure. |
| Hidden card pool pattern | Liquid server-renders all cards (good for SEO), JS clones them into visible columns. No API calls needed for filtering or pagination. |
| Sorting by metaobject GID | `shop.metaobjects.{type}.values` returns alphabetical order, not creation date. The numeric portion of the metaobject GID is sequential and matches admin creation order. |
| Flex columns over CSS masonry | Browser support for CSS masonry is limited. Flex columns with round-robin distribution are reliable and give precise control over the mosaic pattern. |
| Products embedded in hero section | The Figma design shows products as part of the detail content flow, not a separate full-width section. Embedding keeps them in the scrolling content column alongside the sticky image. |
| Self-referencing metaobject for related entries | Editorial control — editors manually curate "you may also like" per entry rather than auto-generating by category. |

---

## Scale Considerations

| Entry Count | Approach |
|-------------|----------|
| Under 250 | Single Liquid paginate page, all cards in DOM, JS handles everything client-side. Current approach. |
| 250 to 500 | Would need multi-page Liquid paginate or AJAX loading of subsequent batches. Filtering complexity increases. |
| 500+ | Revisit architecture — may need Storefront API pagination with lazy loading. Unlikely given curated nature of this content. |

---

## Dependencies on Target Theme

The proof of concept relies on a few theme-specific CSS variables. These are common in Shopify themes but may have different names or not exist:

| Dependency | What It Does | Fallback Strategy |
|------------|-------------|-------------------|
| `--page-width` | Max content width | Hardcode a pixel value if not available |
| `--page-margin` | Horizontal content padding | Hardcode a pixel value |
| `--header-height` | Sticky header height for detail page image offset | Use a fixed pixel value matching the theme's header |
| Font families (Urbanist, Lato) | Typography throughout | Replace with the target theme's font stack |
| esbuild build pipeline | JS compilation | JS is ES5-compatible and can be used as-is in `assets/` without a build step |

---

## Implementation Sequence

1. **Create metaobject definition** — GraphQL mutations (two-step for self-referencing field), set all capabilities
2. **Create directory structure** — `templates/metaobject/` if it doesn't exist
3. **Build shared card snippet** — The reusable component both views depend on
4. **Build detail page** — Hero section + related section + detail template JSON
5. **Build index page** — Grid section + JS source + index template JSON
6. **Add locale strings** — UI text keys in content locale, section names in schema locale
7. **Compile JS** — Run build or place compiled file directly in assets
8. **Admin setup** — Create a Page with the index template, create test entries across categories
9. **Verify** — Filter tabs, load more, detail page rendering, responsive behavior, back link

---

## What's Proof-of-Concept vs. Production-Ready

| Area | POC State | Production Considerations |
|------|-----------|--------------------------|
| Categories | Hardcoded 7 values | Client provides final category list. Must sync across metaobject validation, Liquid, and filter UI. |
| Product card fields | Uses `product.vendor` and `product.type` as placeholders | Swap for actual product metafields (growing zone, common name, etc.) per client data model |
| Colors | Hardcoded hex values | Could be refactored to use theme color scheme CSS variables for dynamic theming |
| Fonts | Hardcoded Urbanist + Lato | Should match the production theme's font stack |
| Content | Test entries with reused images | Client provides real editorial content and imagery |
| Sort order | Newest-first by creation order | Client may want manual sort order, popularity, or other criteria |
| Back link URL | Hardcoded `/pages/get-inspired` | Must match actual page handle in production |
| Rich text | Basic `metafield_tag` rendering | May need custom rich text styling to match production design system |
