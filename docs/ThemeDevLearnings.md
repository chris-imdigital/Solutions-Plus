# Theme Development Learnings

> **Historical Context:** This document explains the evolution of our workflow. For current processes, see [`SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](SHOPIFY-THEME-DEVELOPMENT-GUIDE.md).

## The Problem We Solved

We started with a generic CI/CD model (multiple branches mapped to multiple themes) that didn't fit Shopify's architecture. This created confusion about which theme was "almost live" and unreliable UAT feedback.

## Key Insight

**Themes are deploy targets. Branches represent code states.**

This led to a clean 2-theme model:
- **Live Theme** ← `main` branch (customer-facing)
- **RC Theme** ← `develop` branch (pre-release testing)
- **Preview Themes** ← `feature/*` branches (developer testing only)

## Simplified Workflow

```
Feature → develop → RC Theme → main → Live Theme
```

**Benefits:**
- Reliable UAT on RC theme
- Clear separation between testing and production
- Eliminates confusion about preview themes

## Single-Store Architecture

Since Solutions Plus uses a single production store:

**Advantages:** Simpler setup, real production data for testing  
**Trade-offs:** Shared app configurations, limited payment testing isolation  
**Mitigation:** Use Shopify test mode, be mindful of app-level settings

---

For current workflow details, see [`SHOPIFY-THEME-DEVELOPMENT-GUIDE.md`](SHOPIFY-THEME-DEVELOPMENT-GUIDE.md).
