# Get Inspired Feature — Demo Walkthrough

> How we used Claude Code + MCPs to go from spec to working Shopify theme feature

---

## The Pitch (30 seconds)

We built a full "Get Inspired" feature — masonry gallery with filtering, detail pages, metaobject data model — starting from a feature spec and a Figma design. Claude Code orchestrated two MCP integrations (Figma, Shopify Dev) alongside its own codebase tools to plan and implement across 9 files, two templates, and a client-side JS module.

**Total artifacts:** 1 snippet, 4 sections, 2 JSON templates, 1 JS module + compiled output

---

## Context: Where This Feature Came From

This wasn't a cold start. The "Get Inspired" feature evolved through project discovery:

- **01-24 creative call** — Client described a "Design Shop" / inspiration gallery concept
- **01-30 design sync** — Chris offered to POC metaobjects in his dev store
- **02-09 internal scrum** — Feature referenced as part of Phase 1 catalog mode scope
- **02-10** — POC complete, architecture spec written for dev handoff

The feature spec in the repo (`docs/features/Get_Inspired_Feature_Spec.md`) is the distilled output of that process. It captures the data model, architecture decisions, gotchas, and POC-vs-production gaps — everything Claude Code needs to build from.

**Key context baked into the spec:**
- This is a POC for dev handoff, not production code
- Categories are 7 hardcoded values (client provides final list later)
- Product cards use placeholder fields until real metafields exist
- Self-referencing metaobject requires two-step create
- `onlineStore` capability not supported in TOML — must use GraphQL

---

## Two-Phase Build

The feature has two distinct implementation phases that use different tools and talk to different parts of Shopify:

**Phase 1 — Data Layer (GraphQL Admin API)**
Set up the store's data architecture: create the metaobject definition, configure capabilities, upload images, and populate test entries. This phase uses the Shopify Dev MCP to introspect the Admin GraphQL schema and validate mutations. No theme code is written — it's purely store configuration via API.

**Phase 2 — Frontend (Theme Code + Figma)**
Build the Liquid sections, JS module, and templates that render the data. This phase uses the Figma MCP for design specs and the Shopify Dev MCP for Liquid API context and theme validation. The frontend reads from the metaobjects that Phase 1 created.

```
Phase 1: Data Layer                    Phase 2: Frontend
(GraphQL Admin API)                    (Theme Code)

Spec ──→ Schema introspection          Figma ──→ Design context
  │      (Shopify Dev MCP)               │      (Figma MCP)
  v                                      v
Create definition ──→ Add self-ref     Explore codebase ──→ Plan
  │                    field               │                  │
  v                    (2nd mutation)       v                  v
Upload images                          Build sections      Build JS
  │                                    + snippets           module
  v                                        │                  │
Create test entries                        v                  v
  │                                    Templates ──→ Validate
  v                                                 (Shopify Dev MCP)
Wire product refs
+ related entries
  │
  v
Verify in admin
```

---

## Phase 1: Data Layer (GraphQL Admin API)

Claude uses the Shopify Dev MCP to introspect the Admin GraphQL schema (`introspect_graphql_schema`) and validate generated mutations (`validate_graphql_codeblocks`) before running them.

### Step 1: Create the metaobject definition

**What happens:**
- Claude reads the spec's field table and capabilities block
- Uses `introspect_graphql_schema` to look up `metaobjectDefinitionCreate` — confirms field types, validation options, and capability structure
- Generates the mutation with all fields **except** `related_inspirations` (the self-referencing field — can't be in the initial create)
- Validates the mutation with `validate_graphql_codeblocks`

**The mutation creates:**
- 6 field definitions: `title`, `category` (with choices validation), `description` (rich text), `hero_image` (file reference), `products` (list of product references), `sort_order` (integer)
- 3 capabilities: `publishable`, `renderable` (meta title from title, meta description from description), `onlineStore` (URL handle: "inspiration")

**Key gotcha surfaced from spec:** `onlineStore` capability is not supported in TOML metaobject config files. Must use GraphQL Admin API.

### Step 2: Add the self-referencing field

**What happens:**
- Claude generates a `metaobjectDefinitionUpdate` mutation that adds the `related_inspirations` field (type: `list.metaobject_reference`, referencing the `inspiration` type)
- This is a separate mutation because Shopify can't resolve a self-reference during initial creation — the type doesn't exist yet when the first mutation runs

**Key gotcha surfaced from spec:** Self-referencing fields require a two-step create-then-update pattern.

### Step 3: Upload hero images via staged uploads

**What happens:**
- Claude uses `stagedUploadsCreate` to get presigned URLs for image files
- Uploads images to Shopify's CDN
- Each upload returns a `resourceUrl` that becomes the `hero_image` file reference on entries

### Step 4: Create test metaobject entries

**What happens:**
- Claude generates `metaobjectCreate` mutations for 3-5 test entries across different categories
- Each entry includes: title, category, description, hero_image reference, and product GIDs
- Products are referenced by GID (e.g., `gid://shopify/Product/123456`)

### Step 5: Wire related entries

**What happens:**
- Now that multiple entries exist, Claude generates `metaobjectUpdate` mutations to populate the `related_inspirations` field on each entry
- Each entry references 1-3 other entries by their metaobject GIDs

### Step 6: Verify in admin

**What to show:** Open the Shopify admin, navigate to Content > Metaobjects > Inspiration. Show the entries, the field values, the product references. Click through to the storefront URL to confirm routing works.

---

## Phase 2: Frontend (Theme Code + Figma)

With the data layer in place, Claude shifts to building the theme code that renders it. This phase uses the Figma MCP for design specs and the Shopify Dev MCP for Liquid validation.

### Step 7: Start with the spec (2 min)

**What to show:** The feature spec doc already in the repo

**Prompt:**
> "Let's use the Figma MCP, Shopify Dev MCP and the get inspired spec doc to start building out this feature in this dev store environment"

**What Claude does:**
- Reads `docs/features/Get_Inspired_Feature_Spec.md`
- Identifies the data model (metaobject definition), two page types (index + detail), and the technical approach (Liquid + JS hybrid)
- Asks clarifying questions about which feature and whether we have Figma designs

**Why it matters:** Claude doesn't just start coding — it reads and understands the full spec first, then asks targeted questions to narrow scope.

---

### Step 8: Pull Figma designs via MCP (2 min)

**What to show:** Figma file open with the index page selected

**What Claude does:**
- Calls `get_screenshot` — captures a visual of the full index page layout
- Calls `get_design_context` — extracts structural code + design tokens (colors, spacing, typography, component hierarchy)
- Spawns a background agent to parse the 100K+ character design context into implementation-ready CSS values

**Key design details extracted:**
- 4-column flex masonry (not CSS masonry), 323px columns, 20px gap
- Product swatches: 32px rounded squares (6px radius), not circles
- Filter tabs: active = `#dfc1e6` bg + bold, inactive = transparent
- Typography: Urbanist Bold headings, Lato body at specific sizes/weights
- Load more button: `#a262ae`, 268px wide, 6px radius

**Why it matters:** Figma MCP gives pixel-level design specs without manual handoff. No "eyeballing" hex codes or font sizes.

---

### Step 9: Explore the codebase (2 min)

**What to show:** Claude launching parallel explore agents

**What Claude does (in parallel):**
- **Explore agent 1:** Theme architecture — identifies Horizon theme, section patterns, schema conventions, block system, build pipeline
- **Explore agent 2:** CSS architecture — Tailwind config, CSS variable naming (`--gap-*`, `--margin-*`), color scheme patterns, spacing snippets, grid utilities

**Key findings:**
- Theme: Horizon by Shopify
- Build: PostCSS + Tailwind + esbuild (IIFE output)
- Sections use `{% stylesheet %}` for embedded CSS
- Color schemes via `color-{{ scheme.id }}` classes
- No existing metaobject templates — this is the first
- Responsive breakpoint: 750px

**Why it matters:** Claude understands *existing* patterns before writing new code. No style drift.

---

### Step 10: Load Shopify Dev context (1 min)

**What to show:** Shopify Dev MCP calls

**What Claude does:**
- Calls `learn_shopify_api` with `api: "liquid"` — loads full Liquid reference (objects, filters, tags, template architecture, schema validation rules)
- Calls `learn_shopify_api` with `api: "custom-data"` — loads metaobject/metafield patterns

**What it provides:**
- Confirms `shop.metaobjects.inspiration.values` is the correct Liquid access pattern
- Confirms `paginate` tag works with metaobject arrays (up to 250 per page)
- Provides section schema validation rules
- Confirms `{% stylesheet %}` and `{% javascript %}` tag behavior

**Why it matters:** Claude doesn't hallucinate Liquid syntax. The MCP provides validated API context.

---

### Step 11: Plan mode (3 min)

**What to show:** Claude entering plan mode, generating the implementation plan

**What Claude does:**
- Enters plan mode (read-only, no file edits)
- Synthesizes all sources: spec requirements + Figma design specs + codebase patterns + Shopify API context
- Designs file inventory (8 create, 2 modify)
- Defines implementation sequence with dependencies
- Documents key technical decisions with rationale

**Key decisions in the plan:**

| Decision | Rationale |
|----------|-----------|
| Flex columns, not CSS masonry | Matches Figma exactly; 4 independent columns |
| Hidden card pool + JS distribution | Server-render for SEO, JS handles interactivity |
| Client-side filtering | Storefront API lacks metaobject field filtering |
| `handleize` on category values | Consistent slug matching between Liquid data attributes and JS filter logic |
| Products embedded in hero section | Figma design shows products in the content flow, not a separate full-width section |

**Why it matters:** The plan catches architectural decisions before any code is written. You review the approach, not debug it after the fact.

---

### Step 12: Implementation (show key files)

**Files created:**

| File | Lines | Role |
|------|-------|------|
| `snippets/inspiration-card.liquid` | 137 | Shared card: image, swatches, title, category |
| `sections/inspiration-grid.liquid` | 270 | Index page: header, filter tabs, masonry, load more |
| `sections/inspiration-hero.liquid` | 315 | Detail page: sticky hero image, product grid, back link |
| `sections/inspiration-related.liquid` | 123 | Detail page: horizontal scroll of related cards |
| `sections/inspiration-products.liquid` | ~ | Detail page: product grid section |
| `src/scripts/inspiration-grid.js` | 155 | Client-side filtering, column distribution, load more |
| `templates/page.get-inspired.json` | 26 | Index page template |
| `templates/metaobject/inspiration.json` | 34 | Detail page template |

**Highlight these patterns:**

**a) The masonry distribution algorithm** (`inspiration-grid.js:61-86`)
```javascript
// Cards distributed round-robin across columns
// Each column gets a rotating size pattern for visual variety
var SIZE_PATTERNS = [
  ['tall', 'medium', 'short', 'xtall'],   // Col 1
  ['medium', 'xtall', 'tall', 'short'],    // Col 2
  ['xtall', 'short', 'medium', 'tall'],    // Col 3
  ['short', 'medium', 'tall', 'xtall']     // Col 4
];
```

**b) The Liquid to JS handoff** (`inspiration-grid.liquid:198-206`)
```liquid
<div data-card-pool>
  {%- paginate shop.metaobjects.inspiration.values by 250 -%}
    {%- for entry in shop.metaobjects.inspiration.values -%}
      <div class="inspiration-card-wrapper" data-entry-id="...">
        {% render 'inspiration-card', entry: entry %}
      </div>
    {%- endfor -%}
  {%- endpaginate -%}
</div>
```
Server-renders all cards into a hidden pool for SEO. JS clones them into visible columns — no API calls for filtering or pagination.

**c) The sticky hero image** (`inspiration-hero.liquid:28-36`)
```css
@media screen and (min-width: 750px) {
  .inspiration-hero__image-wrapper {
    position: sticky;
    top: calc(var(--header-height, 60px) + 20px);
    width: 562px;
    height: 734px;
    align-self: flex-start;
  }
}
```

---

### Step 13: Validation via Shopify Dev MCP

**What to show:** Theme validation call

**What Claude does:**
- Calls `validate_theme` with all created/updated files
- MCP validates: Liquid syntax, schema JSON structure, locale key references, tag usage

**What it catches:**
- Invalid Liquid filters or objects
- Missing locale keys referenced in schemas
- Malformed schema JSON
- Deprecated or non-existent Liquid objects

**Why it matters:** Validation happens during development, not after deploy.

---

## Knowledge Sources Used

Claude Code didn't work from a single file. It pulled from multiple layers:

| Source | Tool | What It Provided |
|--------|------|------------------|
| **Feature Spec** | Repo file (Read) | Data model, template structure, frontend behavior, category choices, gotchas, open questions |
| **Figma designs** | Figma MCP | Pixel-level design specs: colors, typography, spacing, component structure, layout |
| **Theme codebase** | Explore agents | Existing patterns, CSS architecture, build pipeline, section conventions |
| **Shopify Liquid API** | Shopify Dev MCP | Validated Liquid syntax, metaobject access patterns, schema rules |
| **Shopify Custom Data API** | Shopify Dev MCP | Metaobject definition patterns, capabilities, field types |

**The takeaway:** A well-written spec is the foundation. Figma gives the visual target. The codebase tells Claude how to match existing conventions. The Shopify MCP validates the output. Each source fills a gap the others can't.

---

## MCP Usage Summary

| MCP | Phase | Tool Calls | Purpose |
|-----|-------|-----------|---------|
| **Shopify Dev** | 1 (Data) | `introspect_graphql_schema`, `validate_graphql_codeblocks` | Look up Admin API mutation shapes, validate generated GraphQL |
| **Shopify Dev** | 2 (Frontend) | `learn_shopify_api` (x2), `validate_theme` | Load Liquid + Custom Data API context, validate theme code |
| **Figma** | 2 (Frontend) | `get_screenshot`, `get_design_context` | Extract visual specs, colors, typography, spacing, component structure |
| **Built-in tools** | Both | `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash` | File operations, codebase exploration, JS compilation |

---

## What This Demonstrates

1. **Full-stack with one tool** — Data layer via GraphQL Admin API *and* frontend via Liquid/CSS/JS, all orchestrated through Claude Code with MCPs.
2. **Spec-driven development** — Feature spec to structured plan to implementation. Not ad-hoc coding.
3. **Schema-aware GraphQL** — Shopify Dev MCP lets Claude introspect the actual Admin API schema before generating mutations. No guessing field types or capability structures.
4. **Design fidelity** — Figma MCP extracts exact values (hex codes, px sizes, font weights). No approximation.
5. **Platform awareness** — Shopify Dev MCP provides validated Liquid/API context. No hallucinated syntax.
6. **Codebase respect** — Explore agents read existing patterns before writing. New code matches theme conventions.
7. **Gotcha handling** — Spec documents platform-specific gotchas (self-referencing two-step, onlineStore TOML limitation) and Claude surfaces them during planning.
8. **Validation at every layer** — GraphQL mutations validated before execution, theme code validated before deployment.

---

## POC vs. Production

The build is a POC. These gaps are documented and intentional:

| Area | POC State | Production Need |
|------|-----------|-----------------|
| Categories | 7 hardcoded values | Client provides final list |
| Product card fields | Uses `product.vendor` and `product.type` | Swap for actual product metafields (growing zone, common name) |
| Colors and fonts | Hardcoded hex values (Urbanist/Lato) | Match target theme's design system variables |
| Content | Test entries with reused images | Client provides real editorial content |
| Sort order | Newest-first by GID | Client may want manual ordering via `sort_order` field |
| Theme CSS vars | Assumes `--page-width`, `--page-margin`, `--header-height` | Must verify against production theme |

---

## Reproduction Checklist

To demo this live, you need:

- [ ] A Shopify dev store with the Horizon-based theme
- [ ] The feature spec doc in `docs/features/Get_Inspired_Feature_Spec.md`
- [ ] Figma file with the Get Inspired designs (index + detail pages)
- [ ] Figma MCP connected (Figma desktop app running)
- [ ] Shopify Dev MCP configured
- [ ] Node.js installed (for `npm run js:build`)

**Suggested live demo flow:**

*Phase 1 — Data Layer*
1. Show the spec's data model section (1 min)
2. Claude introspects the Admin GraphQL schema via Shopify Dev MCP (1 min)
3. Claude generates and validates the `metaobjectDefinitionCreate` mutation (2 min)
4. Run mutation, then the self-referencing field update (1 min)
5. Claude generates test entry mutations with product references (2-3 min)
6. Show entries in Shopify admin — fields, products, URLs (1 min)

*Phase 2 — Frontend*
7. Show the Figma design (30 sec)
8. Claude pulls Figma design context, explores codebase (3-4 min)
9. Review the generated plan (2 min)
10. Approve and watch implementation — sections, JS, templates (5-8 min)
11. Show the running result in the dev store with live data (2 min)

**Total demo time:** ~20-25 minutes

---

## Files Reference

```
docs/features/Get_Inspired_Feature_Spec.md    <- Input: feature spec
snippets/inspiration-card.liquid               <- Output: shared card
sections/inspiration-grid.liquid               <- Output: index masonry
sections/inspiration-hero.liquid               <- Output: detail hero
sections/inspiration-products.liquid           <- Output: detail products
sections/inspiration-related.liquid            <- Output: detail related
templates/page.get-inspired.json               <- Output: index template
templates/metaobject/inspiration.json          <- Output: detail template
src/scripts/inspiration-grid.js                <- Output: client-side JS
assets/inspiration-grid.min.js                 <- Output: compiled JS
```
