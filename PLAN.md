# Lumicore Labs — Internal Tracking App

## Project Plan & Architecture

---

## Overview

A full-stack internal tool for **Lumicore Labs** to manage business prospecting, personal finances, daily todos, and (later) server health monitoring — all scoped per user with admin-level oversight.

---

## Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Frontend    | Vue 3 (Composition API) + Vite            |
| UI Library  | PrimeVue 4 + PrimeFlex                    |
| Backend     | Node.js + Express.js                      |
| Database    | MySQL                                     |
| Auth        | JWT (access token stored in localStorage) |
| HTTP Client | Axios                                     |

---

## Roles

| Role     | Capabilities                                                    |
| -------- | --------------------------------------------------------------- |
| Admin    | Full access, manage users, view all users' data                 |
| Employee | Access own data only (finances, todos, assigned business leads) |

---

## Modules

### Phase 1 (Build Now)

1. **Auth** — Login, JWT, user management (admin only)
2. **Business Prospecting** — Manual business entry + cold calling tracker
3. **Personal Finance** — Income & expense tracking with custom categories
4. **Todo List** — Per-user daily task management

### Phase 2 (Future)

5. **Google Maps Scraper** — Automated scraping via Outscraper/SerpAPI
6. **Server Error Tracker** — Integrate with Lumicore deployed apps (PM2 logs)

---

## Database Schema

### `users`

```sql
id          INT PK AUTO_INCREMENT
name        VARCHAR(100)
email       VARCHAR(100) UNIQUE
password    VARCHAR(255)  -- bcrypt hash
role        ENUM('admin', 'employee') DEFAULT 'employee'
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `businesses`

```sql
id            INT PK AUTO_INCREMENT
name          VARCHAR(200)
type          VARCHAR(100)    -- e.g. saloon, vehicle sales, mobile shop
phone         VARCHAR(50)
address       TEXT
city          VARCHAR(100)
google_maps_url TEXT
website       VARCHAR(255)    -- null means no website (our target)
status        ENUM('new', 'contacted', 'interested', 'rejected', 'converted') DEFAULT 'new'
assigned_to   INT FK -> users.id
added_by      INT FK -> users.id
notes         TEXT
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `cold_calls`

```sql
id            INT PK AUTO_INCREMENT
business_id   INT FK -> businesses.id
called_by     INT FK -> users.id
call_date     DATE
outcome       ENUM('no_answer', 'not_interested', 'callback', 'interested', 'converted')
notes         TEXT
next_followup DATE
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `finance_categories`

```sql
id            INT PK AUTO_INCREMENT
user_id       INT FK -> users.id
name          VARCHAR(100)
type          ENUM('income', 'expense')
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `finance_records`

```sql
id            INT PK AUTO_INCREMENT
user_id       INT FK -> users.id
category_id   INT FK -> finance_categories.id
type          ENUM('income', 'expense')
amount        DECIMAL(10,2)
description   VARCHAR(255)
date          DATE
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `todos`

```sql
id            INT PK AUTO_INCREMENT
user_id       INT FK -> users.id
title         VARCHAR(255)
description   TEXT
status        ENUM('pending', 'in_progress', 'done') DEFAULT 'pending'
priority      ENUM('low', 'medium', 'high') DEFAULT 'medium'
due_date      DATE
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at    TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

---

## Folder Structure

```
lumicore-tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MySQL connection pool
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verify + role guard
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── businesses.js
│   │   │   ├── coldcalls.js
│   │   │   ├── finance.js
│   │   │   └── todos.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/                   # Axios service files per module
    │   ├── components/            # Reusable UI pieces
    │   ├── composables/           # useAuth, useToast, etc.
    │   ├── layouts/
    │   │   └── AppLayout.vue      # Sidebar + topbar shell
    │   ├── router/
    │   │   └── index.js
    │   ├── stores/
    │   │   └── auth.js            # Pinia store
    │   ├── views/
    │   │   ├── auth/
    │   │   │   └── LoginView.vue
    │   │   ├── dashboard/
    │   │   │   └── DashboardView.vue
    │   │   ├── businesses/
    │   │   │   ├── BusinessListView.vue
    │   │   │   └── BusinessDetailView.vue
    │   │   ├── finance/
    │   │   │   ├── FinanceView.vue
    │   │   │   └── CategoriesView.vue
    │   │   ├── todos/
    │   │   │   └── TodoView.vue
    │   │   └── admin/
    │   │       └── UsersView.vue
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    └── package.json
```

---

## API Endpoints

### Auth

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| POST   | `/api/auth/login` | Login, returns JWT |
| GET    | `/api/auth/me`    | Get current user   |

### Users (Admin only)

| Method | Endpoint         | Description    |
| ------ | ---------------- | -------------- |
| GET    | `/api/users`     | List all users |
| POST   | `/api/users`     | Create user    |
| PUT    | `/api/users/:id` | Update user    |
| DELETE | `/api/users/:id` | Delete user    |

### Businesses

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| GET    | `/api/businesses`     | List (admin=all, employee=own) |
| POST   | `/api/businesses`     | Add new business               |
| PUT    | `/api/businesses/:id` | Update business details        |
| DELETE | `/api/businesses/:id` | Delete (admin only)            |

### Cold Calls

| Method | Endpoint                    | Description        |
| ------ | --------------------------- | ------------------ |
| GET    | `/api/businesses/:id/calls` | List calls for biz |
| POST   | `/api/businesses/:id/calls` | Log a call         |
| PUT    | `/api/coldcalls/:id`        | Update call record |

### Finance

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/api/finance/categories`     | List user's categories    |
| POST   | `/api/finance/categories`     | Create category           |
| DELETE | `/api/finance/categories/:id` | Delete category           |
| GET    | `/api/finance/records`        | List records (filterable) |
| POST   | `/api/finance/records`        | Add record                |
| PUT    | `/api/finance/records/:id`    | Update record             |
| DELETE | `/api/finance/records/:id`    | Delete record             |

### Todos

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/todos`     | List user's todos            |
| POST   | `/api/todos`     | Create todo                  |
| PUT    | `/api/todos/:id` | Update todo (status, fields) |
| DELETE | `/api/todos/:id` | Delete todo                  |

---

## Frontend Pages

| Route                 | View               | Access     |
| --------------------- | ------------------ | ---------- |
| `/login`              | LoginView          | Public     |
| `/`                   | DashboardView      | All users  |
| `/businesses`         | BusinessListView   | All users  |
| `/businesses/:id`     | BusinessDetailView | All users  |
| `/finance`            | FinanceView        | All users  |
| `/finance/categories` | CategoriesView     | All users  |
| `/todos`              | TodoView           | All users  |
| `/admin/users`        | UsersView          | Admin only |

---

## Dashboard (Summary Cards)

- Total businesses tracked / converted this month
- My open todos count
- This month's income vs expenses (net)
- Businesses due for follow-up today

---

## Build Phases

### Phase 1 — Core App

- [ ] Project scaffolding (backend + frontend)
- [ ] DB schema + migrations
- [ ] Auth (login, JWT middleware, role guard)
- [ ] User management (admin)
- [ ] Business prospecting CRUD + status tracking
- [ ] Cold call log per business
- [ ] Finance categories + records
- [ ] Todo list
- [ ] Dashboard summary

### Phase 2 — Enhancements

- [ ] Google Maps scraper integration (SerpAPI/Outscraper)
- [ ] Bulk import scraped businesses
- [ ] Server error tracker (PM2 log ingestion from VPS apps)
- [ ] Email/notification for follow-up reminders
- [ ] Finance charts (monthly breakdown)

---

## Deployment (Hostinger VPS)

- Backend: PM2 process manager, Node.js app on port 3000
- Frontend: Nginx static serve (Vite build output)
- DB: MySQL on same VPS, local socket connection
- Reverse proxy: Nginx routes `/api/*` to Express, `/` to frontend dist
- SSL: Let's Encrypt via Certbot

---

## Notes & Decisions

- **No Google Maps scraping in Phase 1** — avoid ToS issues and fragile scrapers. Manual entry is fast and sufficient for a small team.
- **JWT stored in localStorage** — acceptable for an internal team tool; not exposed to public users.
- **Single MySQL DB** — all users' data in shared tables, filtered by `user_id`. Simple and easy to maintain for 2–5 people.
- **PrimeFlex for layout** — avoids writing custom CSS; keeps UI consistent with PrimeVue component styles.
- **Pinia for state** — lightweight, Vue 3 native, only auth store needed for Phase 1.
