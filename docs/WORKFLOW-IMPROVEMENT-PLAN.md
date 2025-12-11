# Theme & Repo Workflow Management Plan

> **Status:** Pending Implementation  
> **Created:** December 2024  
> **Goal:** Track all theme files in Git, rely on native GitHub integration for sync, establish ownership and communication protocols.

---

## Overview

Track all theme files (including templates) in Git and rely on Shopify's native GitHub integration for bidirectional sync. Focus on documentation for ownership boundaries and communication protocols to prevent conflicts.

---

## Implementation Todos

- [ ] Remove `templates/**/*.json` from `.gitignore`
- [ ] Remove `templates/**/*.json` from `.shopifyignore`
- [ ] Pull existing templates from live theme and commit to Git
- [ ] Remove manual pull step from `deploy.yml` (native integration handles sync)
- [ ] Create `docs/FILE-OWNERSHIP.md` with ownership matrix
- [ ] Create `docs/CHANGE-PROTOCOL.md` with communication guidelines
- [ ] Update `SHOPIFY-THEME-DEVELOPMENT-GUIDE.md` sections 8 and 13

---

## 1. Start Tracking Templates

Currently templates are gitignored. Change this to get full version history and let native integration sync client changes.

### Update `.gitignore`

Remove or comment out:

```gitignore
# Templates with admin customizations (including subfolders)
# templates/**/*.json  <-- REMOVE THIS LINE
```

### Update `.shopifyignore`

Remove or comment out:

```
# templates/**/*.json  <-- REMOVE THIS LINE
```

### Initial Sync

After removing from gitignore, pull current templates from the live theme:

```bash
shopify theme pull --theme LIVE_THEME_ID --only 'templates/*.json' --path .
git add templates/
git commit -m "Track templates - enable native GitHub integration sync"
```

---

## 2. Simplify Deploy Workflow

With native integration handling sync, remove the manual pull steps for admin-managed files.

### Update `.github/workflows/deploy.yml`

**Remove this step from `deploy-develop` job:**

```yaml
# DELETE THIS - native integration handles it
- name: Pull admin-managed files
  run: |
    shopify theme pull --theme ${{ secrets.PROD_RC_THEME_ID }} --path .
    git checkout -- .
```

Keep the `--nodelete` flag on push to preserve app-generated files (EComposer).

---

## 3. File Ownership Documentation

Create `docs/FILE-OWNERSHIP.md`:

| File/Pattern | Owner | Edit Via | Notes |
|--------------|-------|----------|-------|
| `sections/*.liquid` | Dev | Code | Core sections |
| `snippets/*.liquid` | Dev | Code | Components |
| `blocks/*.liquid` | Shared | Both | AI/Sidekick blocks |
| `config/settings_schema.json` | Dev | Code | Defines settings |
| `config/settings_data.json` | Shared | Both | Global settings - coordinate before editing |
| `templates/*.json` | Shared | Both | Page templates - coordinate before editing |
| `locales/*.json` | Dev | Code | Translations |
| `assets/ecom-*` | App | N/A | EComposer managed |

**Naming convention (recommended):**

- Client-created sections: prefix with `custom-` (e.g., `custom-hero.liquid`)
- Dev sections: no prefix

---

## 4. Communication Protocol

Create `docs/CHANGE-PROTOCOL.md`:

### For Developers

1. Before editing shared files (`settings_data.json`, templates), check GitHub for recent commits from Shopify bot
2. Pull latest before making changes: `git pull origin develop`
3. Notify client before major deployments

### For Clients

1. Theme Editor changes sync automatically - no action needed
2. Before major customization work, notify dev team
3. If you see a merge conflict warning in Theme Editor, stop and contact dev team

### Conflict Resolution

When native integration reports a conflict:

1. Developer pulls latest: `git pull origin [branch]`
2. Resolve conflicts locally
3. Push resolution: `git push`
4. Theme updates automatically

---

## 5. Update Existing Documentation

Update `docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`:

- Section 8 (Admin-Managed Files Strategy): Update to reflect templates are now tracked
- Section 13 (Project-Specific Deviations): Remove the "Templates Not Tracked" deviation

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `.gitignore` | Remove `templates/**/*.json` |
| `.shopifyignore` | Remove `templates/**/*.json` |
| `.github/workflows/deploy.yml` | Remove manual pull step from deploy-develop |
| `docs/FILE-OWNERSHIP.md` | Create |
| `docs/CHANGE-PROTOCOL.md` | Create |
| `docs/SHOPIFY-THEME-DEVELOPMENT-GUIDE.md` | Update sections 8 and 13 |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| More Git noise from client template edits | Low | Acceptable for full audit trail |
| Simultaneous edits cause conflicts | Medium | Communication protocol + Shopify warns users |
| Client ignores naming conventions | Low | Everything still works, just harder to identify origin |

---

## Background Context

This plan was created to solve:

1. **Active conflicts** between dev team and client changes
2. **Hybrid ownership** of `settings_data.json` - both sides need to edit
3. **Full audit trail** requirement - want all changes tracked in Git

The approach relies on Shopify's native GitHub integration for bidirectional sync rather than manual pull-before-push workflows in CI/CD.