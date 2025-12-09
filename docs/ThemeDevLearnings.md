# Theme Development Learnings

## High-Level Overview: What We Solved and Why We Changed the Workflow

### 1. The Original Problem

We started with a generic CI/CD model that came from traditional web development, not Shopify. It used multiple branches (develop, staging, master) mapped to multiple themes inside a single store.

This created several issues:
- "Staging themes" inside the production store weren't true staging environments
- Clients testing one-off preview themes created confusion and unreliable feedback
- Branching structure was overly complex and didn't reflect how Shopify actually works

We needed a Shopify-native approach that worked within our constraints.

---

### 2. Key Insight: Theme-Level Separation

The breakthrough was understanding:

**Themes are deploy targets. Branches represent code states.**

For Solutions Plus (single store), this led to a clean 2-theme model:

1. **Live Theme** ← `main` branch
   - Customer-facing production
   - Deployed with approval gate

2. **RC (Release Candidate) Theme** ← `develop` branch
   - Pre-release testing and UAT
   - Auto-deployed on merge to develop

3. **Preview Themes** (ephemeral)
   - `feature/*` branches via `shopify theme dev`
   - For internal developer testing only

---

### 3. Simplified Branching Model

We reduced the long-lived branches to:

**develop**
- "What's coming next"
- Integrated features ready for QA/UAT
- Automatically deployed to RC theme

**main**
- "What's live"
- Final approved code
- Deployed to live theme after approval

**feature/***
- Isolated work
- Only used for internal preview/testing

No more separate staging branch. No confusion about which theme is "almost live."

---

### 4. Deployment Model We Implemented

**Automatic deploys:**
- `develop` → RC theme (for QA/UAT testing)
- `main` → Live theme (requires approval)

**Manual deploy:**
- Deploy RC workflow available for deploying any ref to RC theme on-demand

This gives:
- Confidence in pre-release testing
- A safe, deliberate path to go live
- Clear separation between testing and production

---

### 5. Why This Workflow Solves Everything

✔ **Reliable UAT**

Clients and QA test on the RC theme, ensuring consistent behavior before go-live.

✔ **Cleaner deployment lifecycle**

```
Feature → develop → RC Theme → main → Live Theme
```

This is simple to reason about and matches our actual release process.

✔ **Eliminates confusion**

No more random preview theme links being mistaken for "almost-live" versions.

---

### 6. The Problems We Explicitly Solved

| Problem | Solution |
|---------|----------|
| Clients testing features in isolation (preview themes) | Clients only test on RC theme (develop) |
| Too many branches with unclear roles | Reduced to `feature` → `develop` → `main` |
| Overwritten themes | CI handles deploys based on branch rules |
| Need for approval gates | GitHub production environment requires reviewers |
| Hard to sync admin changes | Native Shopify GitHub integration handles bidirectional sync automatically |

---

### 7. The Final Workflow (in one sentence)

Features merge into develop, auto-deploy to RC theme, get approved, then merge to main and deploy to live with approval.

This is now clean, safe, Shopify-native, and easy to reason about.

---

### 8. Single-Store Considerations

Since Solutions Plus operates with a single production store (no separate staging store):

**Advantages:**
- Simpler setup and maintenance
- Fewer secrets and configurations
- RC theme testing happens on real production data and integrations

**Trade-offs:**
- Can't test checkout/payment flows without affecting production environment
- App configurations are shared between RC and Live themes

**Mitigation:**
- Use Shopify's test mode for payment testing when possible
- Be mindful of app-level settings that might affect both themes
- The RC theme provides adequate isolation for most feature testing
