# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Shopify theme (Liquid + TailwindCSS + esbuild). There is no backend, no database, and no Docker. All backend functionality is hosted by Shopify.

### Build pipeline

- **CSS**: `src/styles/theme.css` -> PostCSS/TailwindCSS -> `assets/theme.css`
- **JS**: `src/scripts/*.js` -> esbuild -> `assets/*.min.js` (currently no JS source files exist; esbuild exits gracefully)
- Build command: `npm run build` (runs both CSS and JS builds with `NODE_ENV=production`)
- Dev watchers: `npm run css:watch` and `npm run js:watch` (or combined via `npm run dev`)

### Linting

- `shopify theme check --fail-level error --output=text` -- runs Shopify Theme Check
- Pre-existing errors exist in third-party/app-generated files (e.g. `layout/ecom.liquid`). The CI pipeline tolerates these with `|| true`.

### Running the dev server

- `npm run dev` starts CSS watcher + JS watcher + `shopify theme dev`
- Requires `PROD_STORE` env var (e.g. `solutions-plus.myshopify.com`) and Shopify CLI authentication
- Auth options: `SHOPIFY_CLI_THEME_TOKEN` env var (theme access token), or interactive Shopify partner login
- There is no local mock of Shopify; the CLI proxies against a real store

### Key commands reference

See `package.json` scripts and `docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md` for full details.

### Node.js version

Node.js 22 is used (per CI workflows). The environment comes with nvm; ensure the active version is 22.x.
