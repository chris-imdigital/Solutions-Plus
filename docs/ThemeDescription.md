# Solutions Plus — Shopify Theme

Opinionated Shopify theme based on Horizon with sensible defaults, modern UX, and a clean section/snippet architecture.

## Overview

- Theme name: Solutions Plus
- Base: Horizon (Shopify)
- Key paths:
  - Sections: `sections/`
  - Snippets: `snippets/`
  - Assets: `assets/`
  - Templates: `templates/`
  - Global settings: `config/settings_schema.json`

## Prerequisites

- Shopify CLI (latest)
- Git 2.28+
- Node.js 20+ recommended (for CLI and tooling)

Install Shopify CLI (choose one):

```bash
npm install -g @shopify/cli@latest
# or
brew tap shopify/shopify && brew install shopify-cli
```

## Quick start (local dev)

```bash
# Authenticate once
shopify login --store YOUR_STORE.myshopify.com

# Run a local dev server with live reload
shopify theme dev --path "." --store YOUR_STORE

# Push changes to the store
shopify theme push --unpublished --json

# Open the current theme in your browser
shopify theme open
```

Tip: Use `shopify theme list` to see and target theme IDs in commands.

## Development workflow

1. Create a feature branch.
2. Run `shopify theme dev` during development.
3. Commit early and often; open a PR.
4. Push an unpublished build to QA: `shopify theme push --unpublished`.
5. Share a preview link with stakeholders: `shopify theme share`.
6. Publish when approved: `shopify theme publish --theme <ID>`.

### Linting

Run Theme Check from the project root:

```bash
shopify theme check
```

Fix warnings where practical to keep the codebase healthy and accessible.

## Directory layout (high level)

- `assets/`: Theme scripts, styles, icons, and static assets.
- `blocks/`: Architectural building blocks used inside sections; portable groups of content.
- `sections/`: Page-level modules, each with its own schema and settings.
- `snippets/`: Reusable partials (rendered via `{% render %}`) used by sections/blocks.
- `templates/`: JSON/Liquid templates mapping pages to sections.
- `config/`: Global theme settings and data (`settings_schema.json`, `settings_data.json`).
- `locales/`: Translations for UI strings.

## Product tag badges (cards)

This theme supports tag-driven badges on product cards in collections and search results.

- Rendering: `snippets/product-card-badges.liquid`
- Included by: `blocks/_product-card-gallery.liquid`

### How it works

The snippet renders base badges (Sale / Sold out) and optional tag badges. Tag badges are controlled by global settings under Theme Editor → Badges.

Settings added in `config/settings_schema.json`:

- Color schemes:
  - `badge_new_color_scheme`
  - `badge_bestseller_color_scheme`
  - `badge_limited_color_scheme`
- Enable/trigger/label controls (Badges → Tag badges):
  - `badge_new_enabled`, `badge_new_trigger_tag`, `badge_new_label`
  - `badge_bestseller_enabled`, `badge_bestseller_trigger_tag`, `badge_bestseller_label`
  - `badge_limited_enabled`, `badge_limited_trigger_tag`, `badge_limited_label`

Behavior:

- A badge appears when the product's tags include the configured trigger text (Liquid `contains`).
- Labels are editable per badge.
- Each badge uses its own color scheme via the theme’s color system (e.g., `scheme-2`).

To add another tag badge (e.g., "Preorder"):

1. Add settings to `config/settings_schema.json` (enable, trigger tag, label, color scheme).
2. Mirror the existing logic in `snippets/product-card-badges.liquid` using those settings.
3. Validate with `shopify theme check` and preview.

## Customization notes

- Translations: Sale/Sold out badge text uses translation keys (`locales/*.json`). Custom tag badges use labels from settings.
- Accessibility: Keep badge text concise; avoid all-caps unless dictated by the badge text-transform setting.
- Performance: Badges are lightweight; avoid heavy JS/CSS inside the snippet.

## Troubleshooting

- Badges not showing: Confirm the product has the exact trigger tag and the badge is enabled in Theme settings.
- Color not applying: Verify the badge color scheme is set to a valid scheme and that your color scheme group defines contrasting foreground/background.
- Dev server issues: Re-run `shopify login`, then `shopify theme dev` with `--store`.

## Useful commands

```bash
# Profile theme performance for a specific URL
shopify theme profile --url /collections/all

# Open an interactive console for Liquid objects
shopify theme console --url /products/example

# Package theme for distribution
shopify theme package
```

---

Maintainers: Update this document when adding new global settings, major sections/blocks, or notable UX features.


