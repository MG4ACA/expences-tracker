# Project Plan — Expense Tracker (Phase 1 MVP)

## Scope & Assumptions
- Stack: Nuxt 3 (JavaScript) + PrimeVue + PrimeIcons + theme, set basic layout shell.
- Currency: LKR (single currency; no conversions).
- Add ESLint/Prettier, husky/lint-staged optional.

## Phase 1 Task Sets
1) Project Bootstrap
- Init Nuxt 3 (JavaScript), add PrimeVue + PrimeIcons + theme, set basic layout shell.
- Add ESLint/Prettier, husky/lint-staged optional.

2) Amplify Data Setup (local-first)
- Install Amplify CLI deps; run `amplify init` (no hosting) when ready.
- Configure GraphQL API via Amplify Data; enable conflict detection optional.
- Generate GraphQL types/codegen for Nuxt client.

3) Data Model (MVP)
- Entities: Category, Transaction (expense/income flag), Account, UserProfile (lightweight placeholder for Phase 2 auth).
- Fields (initial):
  - Category: id, name, type (expense|income), color.
  - Transaction: id, amount (decimal), type (expense|income), categoryId, occurredAt, note, accountId?, createdAt/updatedAt.
  - Account: id, name, type (cash|bank|card|other).
  - UserProfile: id, displayName.
- Relationships: Transaction belongsTo Category; optional belongsTo Account.

4) Nuxt App Features (MVP)
- Pages: Dashboard (list + filters + totals), Add/Edit Transaction, Category management.
- Components: transaction list, filters (date range, category), forms with validation.
- State: Pinia stores consuming Amplify Data GraphQL client.
- Error/empty/loading states; toasts.

5) Testing & Quality
- Unit tests for stores/utils (Vitest). Minimal component tests for forms/validation.
- Lint/format CI step (local for now).

6) Phase 2 Placeholders (tracked but not implemented)
- Auth (Cognito via Amplify Auth) and multi-user scoping.
- Reports: monthly totals, category breakdowns (charts) via aggregated queries or client-side compute.
- Hosting: Amplify Hosting pipeline.

## Deliverables for Phase 1
- Running Nuxt app with PrimeVue shell and base pages/components.
- Amplify Data schema and generated types; CRUD flows for categories and transactions.
- Pinia stores wired to GraphQL with optimistic updates and error handling.
- Tests + lint scripts.

## Open Items to Confirm
- None for Phase 1; proceed with LKR, Account included, JavaScript + Pinia, PrimeVue theme: Lara Light Indigo (can be changed later).
