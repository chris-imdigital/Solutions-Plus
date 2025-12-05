# Bestway Shopify Theme

## How to start

1. Install [Shopify CLI](https://shopify.dev/docs/api/shopify-cli).

2. Install Node dependencies: `npm run dev-init` (or `npm install`).

3. Run `npm run dev`.

## TailwindCSS

This theme integrates TailwindCSS with the existing theme styles. See [.tailwindrc](.tailwindrc) for quick reference.

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

## How to start development

Confluence documentation: [Development](https://imgmedia.atlassian.net/wiki/spaces/RMTL/pages/3725852767/Development+and+Deployment+Process#Development).

## How to deploy to production

Confluence documentation: [Deployment](https://imgmedia.atlassian.net/wiki/spaces/RMTL/pages/3725852767/Development+and+Deployment+Process#Deployment).
