# Solutions+ Shopify Theme

Opinionated Shopify theme based on Horizon with sensible defaults, modern UX, and a clean section/snippet architecture.

## Quick Start

1. Install [Shopify CLI](https://shopify.dev/docs/api/shopify-cli).
2. Install Node dependencies: `npm run dev-init` (or `npm install`).
3. Run `npm run dev`.

For detailed development and deployment workflows, see [`docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md).

## Project Structure

- **Sections:** `sections/` - Page-level modules with schemas
- **Snippets:** `snippets/` - Reusable partials
- **Blocks:** `blocks/` - Architectural building blocks
- **Assets:** `assets/` - Scripts, styles, icons
- **Templates:** `templates/` - JSON/Liquid page templates
- **Config:** `config/` - Global theme settings
- **Locales:** `locales/` - UI translations

## TailwindCSS

This theme integrates TailwindCSS with the existing theme styles.

### Project Structure
- **Source:** `src/styles/theme.css` + `src/styles/_base-theme.css`
- **Output:** `assets/theme.css` (auto-generated, do not edit)
- **Config:** `tailwind.config.js` and `postcss.config.js`

### Quick Start
```bash
npm run dev-init  # First time setup
npm run dev       # Start development (CSS watch + Shopify CLI)
npm run build     # Production build (minified CSS)
```

### Important Notes
- Tailwind Preflight is **disabled** to preserve theme CSS variables
- Original theme styles take priority over Tailwind defaults
- Use Tailwind utility classes in `.liquid` files as needed

## Features

### Product Tag Badges

Tag-driven badges on product cards in collections and search results. Configured via Theme Editor → Badges settings. See [`docs/ThemeDescription.md`](docs/ThemeDescription.md#product-tag-badges-cards) for details.

### Custom Engraving

Configurable text input fields for products. See [`docs/features/CUSTOM-ENGRAVING-SETUP.md`](docs/features/CUSTOM-ENGRAVING-SETUP.md) for setup instructions.

## Development & Deployment

- **Development workflow:** See [`docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md#7-day-to-day-development-workflow)
- **Deployment process:** See [`docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md#4-deploy-matrix)
- **Confluence:** [Development and Deployment Process](https://imgmedia.atlassian.net/wiki/spaces/RMTL/pages/3725852767/Development+and+Deployment+Process)

## Documentation

- [`docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md) - Complete development and deployment guide
- [`docs/ThemeDescription.md`](docs/ThemeDescription.md) - Theme architecture and features
- [`docs/features/CUSTOM-ENGRAVING-SETUP.md`](docs/features/CUSTOM-ENGRAVING-SETUP.md) - Custom engraving setup guide
