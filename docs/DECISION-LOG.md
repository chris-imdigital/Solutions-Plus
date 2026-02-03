# Decision Log

> **Purpose:** Chronological record of key architectural and workflow decisions. For detailed documentation, see linked references.

---

## Format

Each entry follows this structure:
- **Date** - When the decision was made
- **Context** - What problem we were solving
- **Decision** - What we chose
- **Rationale** - Why this approach
- **See** - Links to detailed docs

---

## 2024-12 - Theme Deployment Architecture

**Context:** Needed clarity on branch-to-theme mapping. Generic CI/CD model (multiple branches → multiple themes) didn't fit Shopify's architecture, creating confusion about which theme was "almost live" and unreliable UAT feedback.

**Decision:** 2-theme model with single production store
- **Live Theme** ← `main` branch (customer-facing)
- **RC Theme** ← `develop` branch (pre-release testing)
- **Preview Themes** ← `feature/*` branches (developer testing only)

**Rationale:** Themes are deploy targets, not code states. This provides reliable UAT on RC theme, clear separation between testing and production, and eliminates confusion about preview themes.

**See:** [`ThemeDevLearnings.md`](ThemeDevLearnings.md), [`SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](SHOPIFY-THEME-DEVELOPMENT-GUIDE.md)

---

## 2024-12 - Single-Store Architecture

**Context:** Solutions Plus uses a single production store rather than separate staging/production stores.

**Decision:** Use single production store with Live and RC themes instead of separate staging store.

**Rationale:** Simpler setup, real production data for testing. Trade-offs include shared app configurations and limited payment testing isolation, mitigated by using Shopify test mode and being mindful of app-level settings.

**See:** [`SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](SHOPIFY-THEME-DEVELOPMENT-GUIDE.md#13-project-specific-deviations)

---

## 2024-12 - Admin-Managed Files Strategy

**Context:** Need to distinguish between theme code (tracked in Git) and app-generated files (EComposer, etc.) that shouldn't clutter Git history.

**Decision:** 
- **Track in Git:** sections, snippets, blocks, layout, config, locales (native theme files)
- **Ignore in Git:** EComposer files (`ecom-*.liquid`, `ecom-*.css`, `ecom-*.js`)
- **Preserve during deployment:** Pull app-managed files before deploy, then push theme code + app files together

**Rationale:** Third-party apps generate files with cryptic names that aren't human-editable. Theme code needs version history and rollback capability.

**See:** [`SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](SHOPIFY-THEME-DEVELOPMENT-GUIDE.md#8-admin-managed-files-strategy)

---

## 2024-12 - Templates Not Tracked (Current State)

**Context:** Templates are heavily customized through Shopify Admin Theme Editor by clients/admins. Tracking them would create excessive noise in Git history.

**Decision:** Templates (`templates/*.json`) are gitignored and preserved during deployment using `--nodelete` flag.

**Rationale:** Following the "Miami Heat approach" where templates are managed exclusively via Shopify Admin. Works well when clients frequently customize page layouts and multiple stakeholders make template changes.

**Note:** This is a project-specific deviation. See [`WORKFLOW-IMPROVEMENT-PLAN.md`](WORKFLOW-IMPROVEMENT-PLAN.md) for proposed change to track templates.

**See:** [`SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](SHOPIFY-THEME-DEVELOPMENT-GUIDE.md#13-project-specific-deviations)

---

## 2024-12 - Native GitHub Integration for Bidirectional Sync

**Context:** Need automatic sync between Theme Editor changes and Git repository without manual workflows.

**Decision:** Use Shopify's native GitHub integration for automatic bidirectional sync instead of custom sync workflows.

**Rationale:** 
- Instant sync on save (vs delayed scheduled sync)
- Direct commits (vs PR review required)
- Standard Git merge for conflicts (vs custom conflict detection)
- Zero maintenance (vs workflow maintenance required)
- No data loss between syncs

**See:** [`SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](SHOPIFY-THEME-DEVELOPMENT-GUIDE.md#9-native-github-integration-bidirectional-sync)

---

## 2024-12 - Custom Engraving Implementation

**Context:** Need to support products with configurable text input fields (1-10 lines) for custom engraving on product detail pages.

**Decision:** 
- Use product metafields (`custom.custom_engraving_inputs`, `custom.custom_line_character_limit`)
- Store values as line item properties (`properties[Line 1]`, `properties[Line 2]`, etc.)
- Use HTML5 `form` attribute to associate inputs with buy buttons form
- Create dedicated `product.custom-product` template

**Rationale:** Metafields provide flexible configuration per product. Line item properties are standard Shopify pattern for custom product data. Form attribute allows inputs to be placed anywhere while still submitting with add-to-cart.

**See:** [`features/CUSTOM-ENGRAVING-SETUP.md`](features/CUSTOM-ENGRAVING-SETUP.md)

---

## 2024-12 - Workflow Improvement Plan (Pending)

**Context:** Active conflicts between dev team and client changes, hybrid ownership of `settings_data.json`, need for full audit trail.

**Decision:** (Proposed, not yet implemented) Track all theme files including templates in Git, rely on native GitHub integration for sync, establish ownership and communication protocols.

**Rationale:** Full version history, eliminate manual pull-before-push workflows, standard Git conflict resolution.

**Status:** Pending implementation

**See:** [`WORKFLOW-IMPROVEMENT-PLAN.md`](WORKFLOW-IMPROVEMENT-PLAN.md)

---

## Template for Future Entries

```markdown
## YYYY-MM-DD - [Decision Title]

**Context:** [What problem were we solving? What constraints existed?]

**Decision:** [What did we choose? Be specific about the approach.]

**Rationale:** [Why this approach? What alternatives did we consider?]

**See:** [`filename.md`](filename.md) or [`features/feature-name.md`](features/feature-name.md)
```

