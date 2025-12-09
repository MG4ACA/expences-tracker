# Project Plan — Expense Tracker (Phase 2)

## Overview

Phase 2 adds authentication, advanced reporting features, and cloud deployment to the Phase 1 MVP.

## Phase 2 Task Sets

### Task 1: Amplify Auth Setup

**Objective:** Integrate Cognito User Pools with the expense tracker app

- [ ] Configure Amplify Auth in backend (amplify/auth.ts)
- [ ] Set up Cognito User Pool with email sign-up
- [ ] Create auth context composable (useAuth.js)
- [ ] Build sign-up page (pages/auth/signup.vue)
- [ ] Build sign-in page (pages/auth/signin.vue)
- [ ] Build sign-out functionality
- [ ] Create auth guard middleware for protected routes
- [ ] Store userProfileId in auth context after sign-in
- [ ] Update stores to filter data by current user
- [ ] Add loading/error states for auth operations
- [ ] Test sign-up/sign-in flows

### Task 2: Multi-User Data Scoping

**Objective:** Ensure users only access their own data

- [ ] Update transaction queries to filter by userProfileId
- [ ] Update category queries to filter by userProfileId
- [ ] Update account queries to filter by userProfileId
- [ ] Create UserProfile record on first sign-in
- [ ] Implement user context propagation in stores
- [ ] Add user info display in header (name, email)
- [ ] Test cross-user data isolation

### Task 3: Reports & Analytics

**Objective:** Add monthly reporting and category breakdowns

- [ ] Create reports page (pages/reports/index.vue)
- [ ] Build monthly summary component (income, expense, net)
- [ ] Build category breakdown component (pie chart)
- [ ] Implement transaction trend chart (last 6 months)
- [ ] Add export functionality (CSV, PDF)
- [ ] Create date range filters for reports
- [ ] Calculate running totals and percentages
- [ ] Add data visualization library (Chart.js or similar)
- [ ] Optimize queries for aggregation
- [ ] Test report calculations

### Task 4: Amplify Hosting & CI/CD

**Objective:** Deploy app to production with automatic builds

- [ ] Create GitHub Actions workflow for CI/CD
- [ ] Configure Amplify Hosting backend
- [ ] Set up environment variables (dev, staging, prod)
- [ ] Deploy main branch to hosting
- [ ] Configure custom domain (optional Phase 2.1)
- [ ] Set up error monitoring and logs
- [ ] Performance optimization (bundle size, caching)
- [ ] Set up automated testing in CI
- [ ] Document deployment process

### Task 5: Additional Enhancements

**Objective:** Polish and extend Phase 1 features

- [ ] Add recurring transaction support
- [ ] Implement budget tracking per category
- [ ] Add transaction tagging/labels
- [ ] Implement data backup/export
- [ ] Add push notifications for milestones
- [ ] Improve search functionality
- [ ] Add transaction attachments (receipts)
- [ ] Implement undo/redo for mutations
- [ ] Dark mode toggle (complete implementation)
- [ ] Localization (i18n) setup

## Priority & Sequencing

**High Priority (Core Phase 2):**

1. Task 1: Amplify Auth Setup
2. Task 2: Multi-User Data Scoping
3. Task 4: Amplify Hosting & CI/CD

**Medium Priority (Value-Add):** 4. Task 3: Reports & Analytics

**Low Priority (Nice-to-Have):** 5. Task 5: Additional Enhancements

## Deliverables for Phase 2

- Secure authentication with Cognito User Pools
- Multi-tenant app with proper data isolation
- Production deployment via Amplify Hosting
- Monthly reporting with visualizations
- CI/CD pipeline for automatic deployments
- Enhanced user experience with additional features

## Technical Decisions for Phase 2

**Auth Flow:**

- User signs up → UserProfile created → Redirected to dashboard
- Sign-in validates with Cognito → Sets auth context
- Protected routes check auth state before rendering

**Data Scoping:**

- All queries filtered by `userProfileId` from auth context
- UserProfileId passed to all Amplify Data mutations
- Enforce server-side authorization in GraphQL schema

**Reporting:**

- Client-side aggregation for real-time calculations
- Optional: Lambda functions for large dataset aggregations (Phase 2.1)
- Use Chart.js for visualizations
- Cache reports in localStorage for performance

**Hosting:**

- Use Amplify Hosting (Git-based deployments)
- Auto-deploy on push to main branch
- Preview deployments for feature branches
- Environment variables via AWS Systems Manager Parameter Store

## Dependencies to Add

- `@aws-amplify/auth` — Amplify Auth client
- `chart.js` — Data visualization
- `vue-chartjs` — Vue wrapper for Chart.js
- `@vueuse/core` — Vue utility hooks
- Testing: `vitest`, `@vue/test-utils` (if not already installed)

## Phase 2 Risks & Mitigation

| Risk                                         | Impact | Mitigation                                                |
| -------------------------------------------- | ------ | --------------------------------------------------------- |
| Auth setup complexity                        | High   | Reference AWS docs; use pre-built Authenticator component |
| Data isolation bugs                          | High   | Comprehensive testing; code review for auth context usage |
| Performance degradation with larger datasets | Medium | Pagination in reports; optimize GraphQL queries           |
| Amplify cost increase                        | Medium | Monitor usage; set AWS billing alerts                     |
| CI/CD setup takes longer                     | Low    | Use pre-configured GitHub Actions; adjust timeline        |

## Success Criteria

- ✅ Users can sign up and sign in with email/password
- ✅ Users only see their own transactions, accounts, and categories
- ✅ Reports page displays accurate summaries and charts
- ✅ App deployed to production via Amplify Hosting
- ✅ CI/CD pipeline automatically builds and deploys on commit
- ✅ No data leaks between users (security verification)
- ✅ Load time < 3s for dashboard and reports pages

## Post-Phase 2 Roadmap (Phase 3+)

- Advanced budget and savings goals
- Multi-currency support
- Mobile app (React Native)
- AI-powered expense categorization
- Bank account synchronization
- Bill reminders and notifications
- Collaborative budgeting (shared accounts)
