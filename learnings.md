High-Level Overview: What We Solved and Why We Changed the Workflow

1. The Original Problem

We started with a generic CI/CD model that came from traditional web development, not Shopify. It used multiple branches (develop, staging, master) mapped to multiple themes inside a single store.

This created several issues:
	•	Checkout, app installs, integrations, and payment tests cannot be safely run in a single Shopify store.
	•	“Staging themes” inside the production store weren’t true staging environments.
	•	Clients testing one-off preview themes created confusion and unreliable feedback.
	•	Branching structure was overly complex and didn’t reflect how Shopify actually works.

We needed a Shopify-native approach.

⸻

2. Key Insight: Store-Level Separation

The breakthrough was reframing:

Stores are environments. Themes are deploy targets. Branches represent code states.

This makes everything simpler and more predictable.

It led to a clean 3-layer environment model:

1) Production Store
	•	Live theme ← main
	•	RC (Release Candidate) theme ← manual deploy from develop
	•	Used for final validation with real apps, gateways, integrations

2) Staging Store
	•	Staging theme ← develop
	•	Where QA + clients perform real UAT
	•	Mirror production configuration as closely as possible

3) Feature Previews
	•	feature/* branches only get preview themes (manual) for internal review
	•	Not for client approval

This aligned Shopify’s real constraints with our workflow.

⸻

3. Simplified Branching Model

We reduced the long-lived branches to:

develop
	•	“What’s coming next”
	•	Integrated features ready for QA/UAT
	•	Automatically deployed to staging store

main
	•	“What’s live”
	•	Final approved code
	•	After approval, deployed to production live theme

feature/*
	•	Isolated work
	•	Only used for internal preview/testing

No more separate staging branch. No more mixing preview themes with UAT.

⸻

4. Deployment Model We Implemented

Automatic deploys:
	•	develop → staging store → staging theme
	•	main → production store → live theme (requires approval)

Manual deploy:
	•	Release Candidate (RC)
	•	Triggered manually from GitHub Actions
	•	Deploys develop to prod RC theme
	•	Only run after staging approval
	•	Allows prod-level testing before going live

This gives:
	•	Confidence in staging
	•	Confidence in production integrations
	•	A safe, deliberate path to go live

⸻

5. Why This Workflow Solves Everything

✔ Safer checkout & app testing

They now occur in the staging store, not in production.

✔ Reliable UAT

Clients only test on the staging store main theme, ensuring consistent integrated behavior.

✔ Proper production-level validation

The RC theme in production lets the team verify:
	•	app configuration
	•	metafield-driven logic
	•	payment gateways
	•	shipping functions
	•	middleware integrations

without affecting real customers.

✔ Cleaner deployment lifecycle

Feature → develop → staging → RC → main → live
This mirrors Shopify’s environment reality instead of forcing a generic CI structure.

✔ Eliminates confusion

No more random preview theme links being mistaken for staging or almost-live versions.

⸻

6. The Problems We Explicitly Solved

Problem	Solution
Clients testing features in isolation (preview themes)	Clients only test on staging (develop)
Checkout/app tests interfering with production	Moved to staging store
Hard to validate prod environment behavior	Added manual RC deploy to prod store
Too many branches with unclear roles	Reduced to feature → develop → main
Overwritten staging/prod themes	CI handles deploys based on branch rules
Need for approval gates	GitHub production environment requires reviewers
Hard to sync admin changes	Native Shopify GitHub integration handles bidirectional sync automatically


⸻

7. The Final Workflow (in one sentence)

Features merge into develop, auto-deploy to staging, get approved, manually promoted to a Release Candidate theme on production, then merged to main and deployed to live with approval.

This is now clean, safe, Shopify-native, and easy to reason about.