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
- Requires `PROD_STORE` env var and Shopify CLI authentication via `SHOPIFY_CLI_THEME_TOKEN`
- The store is **password-protected**. `shopify theme dev` needs the storefront password via `--store-password` flag or `STORE_PASSWORD` env var. Without it, the CLI fails in non-interactive mode with "Failed to prompt: Enter your store password".
- The provided `SHOPIFY_CLI_THEME_TOKEN` is an Admin API token (`shpat_` prefix). Admin API tokens have a known limitation: they cannot handle password-protected storefronts for `shopify theme dev`. Using a Theme Access app token (`shptka_` prefix) would remove this limitation and also enable hot module reloading.
- **Workaround for cloud agents**: use `shopify theme push --development` to upload, then open the preview URL in a browser after entering the store password. Or run `shopify theme dev --store-password="$STORE_PASSWORD" --store="$PROD_STORE" --password="$SHOPIFY_CLI_THEME_TOKEN"`.
- There is no local mock of Shopify; the CLI proxies against a real store

### Deploying to preview without dev server

If `shopify theme dev` is blocked, you can still verify theme changes by pushing to a development theme:
```
shopify theme push --development --password="$SHOPIFY_CLI_THEME_TOKEN" --json
```
The JSON output includes `preview_url` and `editor_url`.

### Key commands reference

See `package.json` scripts and `docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md` for full details.

### Node.js version

Node.js 22 is used (per CI workflows). The environment comes with nvm; ensure the active version is 22.x.

### Required secrets

| Secret | Purpose |
|--------|---------|
| `PROD_STORE` | Store URL (e.g. `solutions-plus.myshopify.com`) |
| `SHOPIFY_CLI_THEME_TOKEN` | Admin API token for Shopify CLI (`shpat_` prefix) |
| `STORE_PASSWORD` | Storefront password for password-protected store (needed for `shopify theme dev` and browser preview) |
