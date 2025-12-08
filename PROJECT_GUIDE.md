# Project Guide — Structure & Consistency

## Folder & Naming
- Nuxt 3 conventions: `pages/`, `components/`, `layouts/`, `composables/`, `stores/`, `server/api/`, `assets/`, `styles/`, `utils/`.
- UI atoms: `components/ui/*` (small, reusable), domain components: `components/{domain}/*` (e.g., `components/transactions/TransactionForm.vue`).
- Pinia stores: `stores/{name}.js` with `use{Name}Store`. Keep state serializable.
- Composables: `useXxx.js` for cross-cutting logic (e.g., `useToast`, `useDateRange`).
- Types: `types/` or generated under `types/generated/` from Amplify codegen (DTS only; app code remains JS).
- Tests: colocate as `*.spec.js` near source or `tests/unit/*` for shared helpers.

## Styling & Theming
- PrimeVue: install PrimeVue + PrimeIcons + theme (chosen: Lara Light Indigo). Load in `plugins/primevue.js` and global CSS in `assets/styles/main.css`.
- Define CSS vars in `assets/styles/tokens.css` (spacing, radius, shadow, brand colors) and import in main stylesheet.
- Layout: use `layouts/default.vue` with a shell containing header/nav and main content area. Constrain content width with a max-width container.
- Components should prefer PrimeVue form elements (InputText, Dropdown, Calendar, InputNumber, Button, Toast, Dialog, DataTable/Card) with consistent sizing (`size="small"` when available).
- Keep custom classes in BEM-ish form: `.et-{block}__{element}--{modifier}`.

## Forms & Validation
- Use VeeValidate or built-in form state; ensure required fields and numeric validation for amounts.
- Show inline errors; disable submit while pending; emit success/failure toasts.

## Data & GraphQL
- Use Amplify Data client in a small wrapper composable (`useApiClient`) to keep imports centralized.
- Generated types live under `types/generated/`; do not hand-edit.
- DTO boundaries: map GraphQL shapes to view models in helpers to keep components lean.
- Handle loading/empty/error explicitly; prefer optimistic updates for create/update/delete with rollback on error.

## State & Derived Data
- Pinia for client state; avoid storing full query results if not needed—normalize by id where helpful.
- Derived values (totals, filtered lists) computed in stores/composables, not in components.

## Routing & Pages
- Pages under `pages/` with clear URLs: `/`, `/transactions`, `/transactions/new`, `/categories`.
- Use route middleware for future auth gate (Phase 2); keep placeholder middleware `auth.ts` for easy enablement later.

## Components
- Keep components small: form, list, card, filter bar. Accept props, emit events; avoid hard-coded store access deep in the tree.
- Prefer slots for card/list wrappers to keep them reusable.

## Utilities & Dates
- Centralize date/time utils in `utils/date.js` (format, range helpers). Store and send timestamps as ISO strings; display using local timezone.
- Currency: single code (LKR); format via a helper `formatCurrency(amount, "LKR")`.

## Testing
- Use Vitest + Vue Test Utils; test stores and critical components (forms, filters). Mock Amplify client in tests.

## Accessibility & UX
- Ensure form controls have labels; set `aria-` where PrimeVue needs it. Provide focus states. Use toasts for success/error.

## Commit Hygiene
- Keep changes scoped; run lint/format before commit. Use conventional commits if desired (not enforced yet).
