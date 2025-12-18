# Shopify Theme Development & Deployment Guide

> **Version:** 2.1  
> **Last Updated:** December 2025  
> **Status:** Official Process

This document defines the official methodology for Shopify theme development, testing, and deployment. It establishes a single-store architecture with Release Candidate (RC) and Live themes for proper release management.

---

## Table of Contents

1. [Core Mental Model](#1-core-mental-model)
2. [Environment Architecture](#2-environment-architecture)
3. [Branch Strategy](#3-branch-strategy)
4. [Deploy Matrix](#4-deploy-matrix)
5. [GitHub Actions Workflows](#5-github-actions-workflows)
6. [Secrets & Environment Configuration](#6-secrets--environment-configuration)
7. [Day-to-Day Development Workflow](#7-day-to-day-development-workflow)
8. [Admin-Managed Files Strategy](#8-admin-managed-files-strategy)
9. [Native GitHub Integration (Bidirectional Sync)](#9-native-github-integration-bidirectional-sync)
10. [Backup & Rollback](#10-backup--rollback)
11. [Troubleshooting](#11-troubleshooting)
12. [Quick Reference](#12-quick-reference)
13. [Project-Specific Deviations](#13-project-specific-deviations)

---

## 1. Core Mental Model

We treat Shopify development with two distinct primitives:

| Primitive | What It Represents | Example |
|-----------|-------------------|---------|
| **Themes** | Deploy targets | Live theme, RC theme, Preview themes |
| **Branches** | Code states | `main`, `develop`, `feature/*` |

### Single-Store Architecture

This project uses a **single production store** with two primary themes:

- **Live Theme**: Customer-facing, deployed from `main` branch
- **RC (Release Candidate) Theme**: Pre-release testing, deployed from `develop` branch

This approach provides a clean separation between "what's live" and "what's being tested" while operating within a single store.

---

## 2. Environment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION STORE                               │
│                     (solutions-plus.myshopify.com)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────┐         ┌──────────────────────┐                 │
│   │     LIVE THEME       │         │      RC THEME        │                 │
│   │   ← main branch      │         │   ← develop branch   │                 │
│   │   (auto-deploy       │         │   (auto-deploy)      │                 │
│   │    with approval)    │         │                      │                 │
│   │                      │         │                      │                 │
│   │   🟢 Customer-facing │         │   🟡 Pre-release     │                 │
│   └──────────────────────┘         └──────────────────────┘                 │
│                                                                             │
│   ┌──────────────────────────────────────────────────────┐                  │
│   │              PREVIEW THEMES                          │                  │
│   │         ← feature/* via shopify theme dev            │                  │
│   │                                                      │                  │
│   │         ⚪ Dev testing (local CLI)                   │                  │
│   └──────────────────────────────────────────────────────┘                  │
│                                                                             │
│   • Real apps, integrations, payments                                       │
│   • Real checkout behavior                                                  │
│   • Production data                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Environment Purposes

| Environment | Theme | Purpose |
|-------------|-------|---------|
| **Production** | Live theme | Real customers, real transactions |
| **Release Candidate** | RC theme | Pre-release QA/UAT testing |
| **Development** | Preview themes | Developer testing via CLI |

---

## 3. Branch Strategy

### Long-Lived Branches

Only **two** long-lived branches:

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | "What's live" - production code | Production store → Live theme |
| `develop` | "What's coming next" - integrated, approved features | Production store → RC theme |

### Short-Lived Branches

| Branch Pattern | Purpose | Created From |
|----------------|---------|--------------|
| `feature/*` | In-progress work | `develop` |
| `hotfix/*` | Emergency production fixes | `main` |

### Branch Protection Rules

- **`main`**: Protected, requires PR approval, deploys require GitHub environment approval
- **`develop`**: Protected, requires PR approval

---

## 4. Deploy Matrix

### Automatic Deployments

| Trigger | Source | Target Theme | Purpose |
|---------|--------|--------------|---------|
| Push to `develop` | develop branch | RC theme | QA/UAT environment |
| Push to `main` | main branch | Live theme | Customer-facing (requires approval) |

### Manual Deployments

| Workflow | Default Ref | Target Theme | Purpose |
|----------|-------------|--------------|---------|
| Deploy Release Candidate | `develop` | RC theme | On-demand RC deploy from any ref |

---

## 5. GitHub Actions Workflows

### 5.1 deploy.yml – RC + Production Live

```yaml
name: Deploy Shopify themes

on:
  push:
    branches:
      - develop
      - main

jobs:
  deploy-develop:
    name: Deploy develop → prod RC theme
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build assets
        run: npm run build

      - name: Install Shopify CLI
        run: npm install -g @shopify/cli

      - name: Validate theme files
        run: |
          echo "🔍 Validating Liquid templates..."
          shopify theme check --fail-level error --output=text || true
          echo "✅ Validation complete"

      - name: Pull admin-managed files
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.PROD_THEME_TOKEN }}
          SHOPIFY_FLAG_STORE: ${{ secrets.PROD_SHOPIFY_STORE }}
        run: |
          echo "📥 Pulling admin-managed files (templates, EComposer, blocks)..."
          shopify theme pull --theme ${{ secrets.PROD_RC_THEME_ID }} --path .
          git checkout -- .
          echo "✅ Admin files preserved, tracked files restored to Git state"

      - name: Deploy to prod RC theme
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.PROD_THEME_TOKEN }}
          SHOPIFY_FLAG_STORE: ${{ secrets.PROD_SHOPIFY_STORE }}
        run: |
          echo "🚀 Deploying to RC theme on production store..."
          shopify theme push \
            --theme ${{ secrets.PROD_RC_THEME_ID }} \
            --nodelete
          echo "✅ RC deployment complete"
          echo ""
          echo "📋 Next steps:"
          echo "   1. Test on production RC theme"
          echo "   2. When approved, PR develop → main"
          echo "   3. Merge and approve production deployment"

  deploy-main:
    name: Deploy main → prod live
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build production assets
        run: NODE_ENV=production npm run build

      - name: Install Shopify CLI
        run: npm install -g @shopify/cli

      - name: Validate theme files
        run: |
          echo "🔍 Validating Liquid templates for PRODUCTION..."
          shopify theme check --fail-level error --output=text
          echo "✅ Production validation complete"

      - name: Backup current production theme
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.PROD_THEME_TOKEN }}
          SHOPIFY_FLAG_STORE: ${{ secrets.PROD_SHOPIFY_STORE }}
        run: |
          echo "📦 Creating backup of production theme..."
          BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
          mkdir -p $BACKUP_DIR
          shopify theme pull --theme ${{ secrets.PROD_LIVE_THEME_ID }} --path $BACKUP_DIR
          echo "✅ Backup complete: $BACKUP_DIR"

      - name: Pull app-managed files (EComposer, etc.)
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.PROD_THEME_TOKEN }}
          SHOPIFY_FLAG_STORE: ${{ secrets.PROD_SHOPIFY_STORE }}
        run: |
          echo "📥 Pulling app-managed files..."
          # Only pull files that are in .gitignore (app-generated, not theme code)
          shopify theme pull --theme ${{ secrets.PROD_LIVE_THEME_ID }} --only 'sections/ecom-*.liquid' --path .
          shopify theme pull --theme ${{ secrets.PROD_LIVE_THEME_ID }} --only 'assets/ecom-*.css' --path .
          shopify theme pull --theme ${{ secrets.PROD_LIVE_THEME_ID }} --only 'assets/ecom-*.js' --path .
          echo "✅ App files preserved"

      - name: Deploy to production
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.PROD_THEME_TOKEN }}
          SHOPIFY_FLAG_STORE: ${{ secrets.PROD_SHOPIFY_STORE }}
        run: |
          echo "🚀 Deploying to PRODUCTION..."
          shopify theme push \
            --theme ${{ secrets.PROD_LIVE_THEME_ID }} \
            --nodelete \
            --allow-live
          echo "✅ Production deployment complete"

      - name: Create release tag
        run: |
          TAG_NAME="v$(date +'%Y.%m.%d')-$(git rev-parse --short HEAD)"
          git tag -a $TAG_NAME -m "Production deployment on $(date)"
          git push origin $TAG_NAME
```

### 5.2 deploy-rc.yml – Manual RC Deploy

```yaml
name: Deploy Release Candidate to Prod

on:
  workflow_dispatch:
    inputs:
      ref:
        description: 'Git ref to deploy (branch, tag, or commit)'
        required: false
        default: 'develop'

jobs:
  deploy-rc:
    name: Deploy to prod RC theme
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.ref }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build assets
        run: npm run build

      - name: Install Shopify CLI
        run: npm install -g @shopify/cli

      - name: Deploy to prod RC theme
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.PROD_THEME_TOKEN }}
          SHOPIFY_FLAG_STORE: ${{ secrets.PROD_SHOPIFY_STORE }}
        run: |
          echo "🚀 Deploying to RC theme on production store..."
          shopify theme push \
            --theme ${{ secrets.PROD_RC_THEME_ID }} \
            --nodelete
          echo "✅ RC deployment complete"
          echo ""
          echo "📋 Next steps:"
          echo "   1. Test on production RC theme"
          echo "   2. When approved, PR develop → main"
          echo "   3. Merge and approve production deployment"
```

---

## 6. Secrets & Environment Configuration

### Required GitHub Secrets

#### Production Store

| Secret | Description | Example |
|--------|-------------|---------|
| `PROD_SHOPIFY_STORE` | Production store URL | `solutions-plus.myshopify.com` |
| `PROD_THEME_TOKEN` | Theme Access token for prod | `shptka_xxxxx...` |
| `PROD_LIVE_THEME_ID` | Live theme ID | `123456789013` |
| `PROD_RC_THEME_ID` | Release Candidate theme ID | `123456789014` |

### How to Create Theme Access Tokens

1. Go to Shopify Admin → **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name it "GitHub Deployments"
4. Click **Configure Admin API scopes**
5. Enable: `read_themes`, `write_themes`
6. Click **Install app** and copy the token

### GitHub Environments

Create this environment in GitHub repository settings:

| Environment | Protection Rules |
|-------------|-----------------|
| `production` | Required reviewers (add team members who can approve) |

---

## 7. Day-to-Day Development Workflow

### Feature Development

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/TICKET-123-description

# 3. Develop locally with Shopify CLI
npm run dev
# This connects to the production store for local development

# 4. Push and create PR to develop
git push origin feature/TICKET-123-description
# Create PR: feature/* → develop
```

### QA & UAT Process

1. **Merge to develop** triggers auto-deploy to RC theme
2. **QA team** tests on RC theme (preview the RC theme in Shopify Admin)
3. **Client/stakeholder** approves on RC theme

### Go Live

1. **Create PR**: `develop` → `main`
2. **Code review** and approve PR
3. **Merge** triggers production deployment
4. **Approve** the deployment in GitHub Actions (environment protection)
5. **Verify** live site after deployment

### Hotfix Process

```bash
# 1. Branch from main (production)
git checkout main
git pull origin main
git checkout -b hotfix/TICKET-789-critical-fix

# 2. Make fix and test locally

# 3. PR directly to main
git push origin hotfix/TICKET-789-critical-fix
# Create PR: hotfix/* → main

# 4. After merge, backport to develop
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

---

## 8. Admin-Managed Files Strategy

### Philosophy

We distinguish between two types of files:

| Type | Examples | Strategy |
|------|----------|----------|
| **Theme Code** | sections, snippets, blocks, layout | ✅ Track in Git, sync via native GitHub integration |
| **App-Generated** | EComposer, Shogun, Bloggle files | ❌ Ignore in Git, preserve during deployment |

### What Gets Tracked (Native Theme Files)

These files are **tracked in Git** and sync automatically via Shopify's GitHub integration:

- `sections/*.liquid` — Custom sections
- `snippets/*.liquid` — Reusable components  
- `layout/*.liquid` — Theme layouts
- `blocks/*.liquid` — AI/Sidekick-generated blocks (modern themes)
- `config/settings_data.json` — Theme settings
- `locales/*.json` — Translations
- `templates/*.json` — Template assignments

**Why track these?** Full version history, rollback capability, and consistent deployments regardless of where edits originate (Theme Editor or code).

### What Gets Ignored (App-Generated Files)

These files are **ignored in Git** but **preserved during deployment**:

```gitignore
# .gitignore - App-generated files only

# EComposer page builder
sections/ecom-*.liquid
assets/ecom-*.css
assets/ecom-*.js

# App templates (Shogun, Bloggle, etc.)
templates/*.shogun.*.liquid
templates/*bloggle*.liquid
templates/*.ecom*.liquid

# Build artifacts (compiled from src/)
assets/theme.css
assets/theme.css.map
assets/*.min.js
assets/*.min.js.map
!assets/lib-*.min.js
```

**Why ignore these?** Third-party apps generate files with cryptic names that clutter Git history and aren't human-editable.

### Modern Themes (Horizon, Dawn 2.0+)

For modern themes with Sidekick/AI capabilities:

| File | Old Approach | New Approach |
|------|--------------|--------------|
| `blocks/*.liquid` | ❌ Ignored | ✅ **Tracked** — AI blocks are real code |
| `sections/*.liquid` | ✅ Tracked | ✅ Tracked |
| `snippets/*.liquid` | ✅ Tracked | ✅ Tracked |

### How Deployment Preserves App Files

1. **Before deploy**: Pull app-managed files (EComposer, etc.) from theme
2. **Reset tracked files**: Restore Git version of theme code
3. **Deploy**: Push theme code + app files together
4. **Result**: Theme code updates, app customizations preserved

---

## 9. Native GitHub Integration (Bidirectional Sync)

### Overview

Shopify's native GitHub integration provides **automatic bidirectional sync** between the theme and repository:

- **Admin → Git**: Changes made in Theme Editor automatically commit to the connected branch
- **Git → Admin**: Pushes to the connected branch automatically update the theme

This eliminates the need for custom sync workflows.

### How It Works

| Action | Result |
|--------|--------|
| Edit section in Theme Editor | Automatic commit to connected branch |
| Push code changes to branch | Automatic theme update |
| Merge PR | Theme updates after merge |

### What Gets Synced Automatically

| File Type | Synced? | Notes |
|-----------|---------|-------|
| `sections/*.liquid` | ✅ Yes | Full version history |
| `snippets/*.liquid` | ✅ Yes | Full version history |
| `layout/*.liquid` | ✅ Yes | Full version history |
| `config/settings_data.json` | ✅ Yes | Theme settings |
| `locales/*.json` | ✅ Yes | Translations |
| `blocks/*.liquid` | ✅ Yes | AI/Sidekick-generated blocks (tracked for modern themes) |
| `templates/*.json` | ✅ Yes | Template assignments (can be noisy) |
| `sections/ecom-*.liquid` | ❌ No | EComposer app-managed (in .gitignore) |
| `assets/ecom-*` | ❌ No | EComposer assets (in .gitignore) |

### Setup Requirements

1. **Connect theme to GitHub** in Shopify Admin → Online Store → Themes → Edit code → Connect to GitHub
2. **Select the appropriate branch**:
   - Production live theme → `main` branch
   - RC theme → `develop` branch
3. **Ensure branch protection** allows Shopify's commits

### Benefits Over Custom Sync Workflows

| Custom Sync Workflow | Native GitHub Integration |
|---------------------|--------------------------|
| Delayed sync (scheduled) | Instant sync on save |
| PR review required | Direct commits |
| Custom conflict detection | Standard Git merge |
| Workflow maintenance required | Zero maintenance |
| Changes may be lost between syncs | No data loss |

### Handling Merge Conflicts

If a developer and admin edit the same file simultaneously:

1. **Git handles it** — standard merge conflict
2. **Developer resolves** using normal Git workflow
3. **Push resolution** — theme updates automatically

No special tooling needed.

---

## 10. Backup & Rollback

### Automatic Backups

Every production deployment automatically:
1. Creates a full theme backup before deployment
2. Stores backup as GitHub Actions artifact (30-day retention)
3. Creates a release tag for tracking

### Rollback Options

#### Option 1: Re-deploy Previous Version

```bash
# Find previous release tag
git tag --list

# Deploy specific tag
# Run Deploy RC workflow with ref = tag name
```

#### Option 2: Restore from Backup Artifact

1. Go to GitHub Actions → find deployment run
2. Download backup artifact
3. Manually push restored theme:
   ```bash
   shopify theme push --theme THEME_ID --allow-live
   ```

#### Option 3: Shopify Admin Backup

1. Go to Shopify Admin → Online Store → Themes
2. Find auto-created backup theme (named with date)
3. Click **Publish** to make it live immediately

---

## 11. Troubleshooting

### Common Issues

#### "Theme not found" Error

**Cause:** Invalid theme ID or token doesn't have access.

**Fix:**
1. Verify theme ID in Shopify Admin (URL contains ID)
2. Ensure token has `read_themes` and `write_themes` scopes
3. Check token is for correct store

#### "Authentication failed" Error

**Cause:** Invalid or expired token.

**Fix:**
1. Generate new Theme Access token in Shopify Admin
2. Update the corresponding secret in GitHub

#### Deployment Has Merge Conflicts

**Cause:** Admin made changes to the same files being deployed.

**Fix:**
1. Pull latest changes from the connected branch: `git pull origin main`
2. Resolve any merge conflicts using standard Git workflow
3. Push the resolved changes: `git push origin main`
4. Re-run deployment (or let native integration auto-deploy)

#### Build Fails

**Cause:** Missing dependencies or Node version mismatch.

**Fix:**
1. Ensure `package-lock.json` is committed
2. Check Node.js version matches workflow (22.x)
3. Run `npm ci` locally to verify

### Manual Deployment (Emergency)

```bash
# Set credentials
export SHOPIFY_CLI_THEME_TOKEN="your-token"
export SHOPIFY_FLAG_STORE="store.myshopify.com"

# Build
npm run build

# Deploy
shopify theme push --theme THEME_ID --allow-live
```

---

## 12. Quick Reference

### Branch Summary

| Branch | Purpose | Auto-Deploy? | Target |
|--------|---------|--------------|--------|
| `feature/*` | Work in progress | No | — |
| `develop` | Approved, ready for QA | Yes | RC theme |
| `main` | Production releases | Yes (with approval) | Live theme |

### Deployment Flow

```
feature/* ──PR──▶ develop ──auto──▶ RC Theme (QA/UAT)
                     │
                     │ (PR + approval)
                     ▼
                   main ──auto──▶ Live Theme
```

### Key Commands

```bash
# Start new feature
git checkout develop && git pull
git checkout -b feature/TICKET-123-description

# Local development (connects to production store)
npm run dev

# Sync long-running branch
git checkout develop && git pull
git checkout feature/my-feature
git merge develop
git push

# Emergency hotfix
git checkout main && git pull
git checkout -b hotfix/critical-fix
# ... fix and push, PR to main
```

### Secrets Checklist

- [ ] `PROD_SHOPIFY_STORE`
- [ ] `PROD_THEME_TOKEN`
- [ ] `PROD_LIVE_THEME_ID`
- [ ] `PROD_RC_THEME_ID`

### Environment Checklist

- [ ] `production` environment created with required reviewers

---

## 13. Project-Specific Deviations

This project has intentional deviations from the standard guide:

### Single-Store Architecture

**Standard Guide:** Recommends separate staging and production stores for full environment isolation.

**This Project:** Uses a **single production store** with Live and RC themes.

**Rationale:** Solutions Plus does not have a separate staging store. The RC theme provides adequate pre-release testing while keeping the workflow simple.

### Templates Not Tracked in Git

**Standard Guide:** Templates (`templates/*.json`) should be tracked for version history.

**This Project:** Templates are **gitignored** and preserved during deployment.

**Rationale:** Following the "Miami Heat approach" where templates are heavily customized through the Shopify Admin Theme Editor. Tracking them would create excessive noise in Git history from client/admin changes. Instead:

- Templates are managed exclusively via Shopify Admin
- Deployments use `--nodelete` to preserve existing templates
- `.shopifyignore` excludes templates from Shopify sync

This works well when:
- Clients frequently customize page layouts via Theme Editor
- Multiple stakeholders make template changes
- The focus is on section/snippet code, not template configurations

---

## Support Resources

- **Shopify CLI**: [shopify.dev/docs/api/shopify-cli](https://shopify.dev/docs/api/shopify-cli)
- **Theme Check**: [shopify.dev/docs/themes/tools/theme-check](https://shopify.dev/docs/themes/tools/theme-check)
- **GitHub Actions**: [docs.github.com/en/actions](https://docs.github.com/en/actions)


