# Lumicore Labs Tracker — Test Plan

**Date:** 2026-02-28  
**Stack:** Vue 3 + Vite (frontend) | Node.js + Express + MySQL (backend)  
**Base URL (local):** `http://localhost:3000`  
**Frontend URL:** `http://localhost:5173`

---

## Prerequisites

- Backend running: `cd backend && node src/server.js` (or via PM2)
- Frontend running: `cd frontend && npm run dev`
- MySQL running with schema applied (`backend/database.sql`)
- At least one `admin` user and one `employee` user seeded in the DB
- A REST client (Postman, Bruno, or `curl`) for API tests
- Valid JWT tokens obtained from login for both roles

---

## 1. Health Check

| #   | Test              | Expected                        |
| --- | ----------------- | ------------------------------- |
| 1.1 | `GET /api/health` | `200 OK` → `{ "status": "ok" }` |

---

## 2. Authentication

### 2.1 Backend — `POST /api/auth/login`

| #     | Test                 | Body                          | Expected                                                      |
| ----- | -------------------- | ----------------------------- | ------------------------------------------------------------- |
| 2.1.1 | Valid admin login    | `{ email, password }`         | `200` → `{ token, user: { id, name, email, role: "admin" } }` |
| 2.1.2 | Valid employee login | `{ email, password }`         | `200` → `{ token, user: { role: "employee" } }`               |
| 2.1.3 | Wrong password       | `{ email, bad_password }`     | `401` → `{ message: "Invalid credentials" }`                  |
| 2.1.4 | Unknown email        | `{ unknown@x.com, password }` | `401` → `{ message: "Invalid credentials" }`                  |
| 2.1.5 | Missing fields       | `{ email }` (no password)     | `400` → `{ message: "Email and password required" }`          |
| 2.1.6 | Empty body           | `{}`                          | `400`                                                         |

### 2.2 Backend — `GET /api/auth/me`

| #     | Test                    | Expected                                          |
| ----- | ----------------------- | ------------------------------------------------- |
| 2.2.1 | Valid Bearer token      | `200` → user object (no password field)           |
| 2.2.2 | No Authorization header | `401` → `{ message: "No token provided" }`        |
| 2.2.3 | Malformed token         | `401` → `{ message: "Invalid or expired token" }` |
| 2.2.4 | Expired token           | `401`                                             |

### 2.3 Frontend — Login Page (`/login`)

| #     | Test                                   | Expected                              |
| ----- | -------------------------------------- | ------------------------------------- |
| 2.3.1 | Page loads unauthenticated             | Login form is displayed               |
| 2.3.2 | Valid credentials submitted            | Redirects to `/` (Dashboard)          |
| 2.3.3 | Invalid credentials submitted          | Error message displayed (no redirect) |
| 2.3.4 | Already logged in, visit `/login`      | Redirect to Dashboard                 |
| 2.3.5 | Token stored after login               | `localStorage` contains JWT token     |
| 2.3.6 | Unauthenticated visit to `/businesses` | Redirected to `/login`                |

---

## 3. User Management (Admin Only)

### 3.1 Backend

| #     | Method | Endpoint         | Auth           | Expected                                                        |
| ----- | ------ | ---------------- | -------------- | --------------------------------------------------------------- |
| 3.1.1 | GET    | `/api/users`     | Admin token    | `200` → array of users                                          |
| 3.1.2 | GET    | `/api/users`     | Employee token | `403` → `{ message: "Admin access required" }`                  |
| 3.1.3 | GET    | `/api/users`     | No token       | `401`                                                           |
| 3.1.4 | POST   | `/api/users`     | Admin token    | `{ name, email, password, role }` → `201` → user object         |
| 3.1.5 | POST   | `/api/users`     | Admin token    | Duplicate email → `400` → `{ message: "Email already exists" }` |
| 3.1.6 | POST   | `/api/users`     | Admin token    | Missing required field → `400`                                  |
| 3.1.7 | PUT    | `/api/users/:id` | Admin token    | `{ name }` → `200` → `{ message: "User updated" }`              |
| 3.1.8 | DELETE | `/api/users/:id` | Admin token    | `200` → `{ message: "User deleted" }`                           |
| 3.1.9 | POST   | `/api/users`     | Employee token | `403`                                                           |

### 3.2 Frontend — Admin Users Page (`/admin/users`)

| #     | Test                              | Expected                         |
| ----- | --------------------------------- | -------------------------------- |
| 3.2.1 | Admin visits `/admin/users`       | Users list rendered              |
| 3.2.2 | Employee visits `/admin/users`    | Redirected to Dashboard          |
| 3.2.3 | Admin creates new user            | User appears in list             |
| 3.2.4 | Admin edits user                  | Updated values reflected in list |
| 3.2.5 | Admin deletes user                | User removed from list           |
| 3.2.6 | Admin nav shows "Users" menu item | Link visible only for admin role |

---

## 4. Business Prospecting

### 4.1 Backend

| #      | Method | Endpoint               | Auth           | Expected                                                 |
| ------ | ------ | ---------------------- | -------------- | -------------------------------------------------------- |
| 4.1.1  | GET    | `/api/businesses`      | Employee token | `200` → only own businesses                              |
| 4.1.2  | GET    | `/api/businesses`      | Admin token    | `200` → all businesses                                   |
| 4.1.3  | GET    | `/api/businesses`      | No token       | `401`                                                    |
| 4.1.4  | GET    | `/api/businesses/:id`  | Valid token    | `200` → business object                                  |
| 4.1.5  | GET    | `/api/businesses/9999` | Valid token    | `404` → `{ message: "Business not found" }`              |
| 4.1.6  | POST   | `/api/businesses`      | Valid token    | `{ name, type, phone, city, status }` → `201` → `{ id }` |
| 4.1.7  | POST   | `/api/businesses`      | Valid token    | Missing `name` → `400`                                   |
| 4.1.8  | PUT    | `/api/businesses/:id`  | Valid token    | Update status/notes → `200`                              |
| 4.1.9  | DELETE | `/api/businesses/:id`  | Admin token    | `200`                                                    |
| 4.1.10 | DELETE | `/api/businesses/:id`  | Employee token | `403`                                                    |

### 4.2 Frontend — Business List (`/businesses`)

| #     | Test                          | Expected                                         |
| ----- | ----------------------------- | ------------------------------------------------ |
| 4.2.1 | Page loads                    | List of businesses displayed                     |
| 4.2.2 | Add new business (valid data) | New entry appears in list                        |
| 4.2.3 | Add business without name     | Validation error shown                           |
| 4.2.4 | Click business row            | Navigates to `/businesses/:id`                   |
| 4.2.5 | Admin view                    | All businesses visible; Delete button present    |
| 4.2.6 | Employee view                 | Only own businesses; No Delete button            |
| 4.2.7 | Status badge                  | Renders correct color/label for each status enum |

### 4.3 Frontend — Business Detail (`/businesses/:id`)

| #     | Test                     | Expected                                    |
| ----- | ------------------------ | ------------------------------------------- |
| 4.3.1 | Page loads with valid ID | Business details rendered                   |
| 4.3.2 | Edit business fields     | Changes saved via PUT; Updated values shown |
| 4.3.3 | Invalid ID in URL        | Error state or redirect                     |

---

## 5. Cold Calls

### 5.1 Backend

| #     | Method | Endpoint                    | Auth        | Expected                                    |
| ----- | ------ | --------------------------- | ----------- | ------------------------------------------- |
| 5.1.1 | GET    | `/api/businesses/:id/calls` | Valid token | `200` → array of calls                      |
| 5.1.2 | POST   | `/api/businesses/:id/calls` | Valid token | `{ call_date, outcome }` → `201` → `{ id }` |
| 5.1.3 | POST   | `/api/businesses/:id/calls` | No token    | `401`                                       |
| 5.1.4 | PUT    | `/api/coldcalls/:id`        | Valid token | Update outcome/notes → `200`                |
| 5.1.5 | DELETE | `/api/coldcalls/:id`        | Valid token | `200`                                       |

### 5.2 Frontend — Business Detail Cold Call Section

| #     | Test                                | Expected                           |
| ----- | ----------------------------------- | ---------------------------------- |
| 5.2.1 | Call log renders on Business Detail | Existing calls listed              |
| 5.2.2 | Log a new call                      | Form submits; call appears in list |
| 5.2.3 | Edit call outcome                   | Updated outcome reflected          |
| 5.2.4 | `next_followup` date set            | Date displayed correctly           |

---

## 6. Finance — Categories

### 6.1 Backend

| #     | Method | Endpoint                      | Auth                 | Expected                                                  |
| ----- | ------ | ----------------------------- | -------------------- | --------------------------------------------------------- |
| 6.1.1 | GET    | `/api/finance/categories`     | Valid token          | `200` → own categories only                               |
| 6.1.2 | GET    | `/api/finance/categories`     | No token             | `401`                                                     |
| 6.1.3 | POST   | `/api/finance/categories`     | Valid token          | `{ name, type: "income" }` → `201` → `{ id, name, type }` |
| 6.1.4 | POST   | `/api/finance/categories`     | Valid token          | Missing `type` → `400`                                    |
| 6.1.5 | POST   | `/api/finance/categories`     | Valid token          | Invalid `type` value → check DB constraint                |
| 6.1.6 | DELETE | `/api/finance/categories/:id` | Own user token       | `200`                                                     |
| 6.1.7 | DELETE | `/api/finance/categories/:id` | Different user token | Should not delete (user_id check)                         |

### 6.2 Frontend — Categories Page (`/finance/categories`)

| #     | Test                     | Expected                               |
| ----- | ------------------------ | -------------------------------------- |
| 6.2.1 | Page loads               | Own categories listed, grouped by type |
| 6.2.2 | Create income category   | Appears in income list                 |
| 6.2.3 | Create expense category  | Appears in expense list                |
| 6.2.4 | Create with missing name | Validation error shown                 |
| 6.2.5 | Delete category          | Removed from list                      |

---

## 7. Finance — Records

### 7.1 Backend

| #     | Method | Endpoint                             | Auth           | Expected                                      |
| ----- | ------ | ------------------------------------ | -------------- | --------------------------------------------- |
| 7.1.1 | GET    | `/api/finance/records`               | Valid token    | `200` → own records                           |
| 7.1.2 | GET    | `/api/finance/records?month=2026-02` | Valid token    | Filtered to February 2026                     |
| 7.1.3 | GET    | `/api/finance/records?type=expense`  | Valid token    | Only expense records                          |
| 7.1.4 | GET    | `/api/finance/summary?month=2026-02` | Valid token    | `200` → `{ income, expense, net }`            |
| 7.1.5 | GET    | `/api/finance/summary`               | Valid token    | Defaults to current month                     |
| 7.1.6 | POST   | `/api/finance/records`               | Valid token    | `{ type, amount, date, category_id }` → `201` |
| 7.1.7 | POST   | `/api/finance/records`               | Valid token    | Missing `amount` → `400`                      |
| 7.1.8 | PUT    | `/api/finance/records/:id`           | Own user token | Update amount → `200`                         |
| 7.1.9 | DELETE | `/api/finance/records/:id`           | Own user token | `200`                                         |

### 7.2 Frontend — Finance Page (`/finance`)

| #      | Test                               | Expected                         |
| ------ | ---------------------------------- | -------------------------------- |
| 7.2.1  | Page loads                         | Records listed for current month |
| 7.2.2  | Month filter changes               | List updates to selected month   |
| 7.2.3  | Type filter (income/expense)       | Filtered results shown           |
| 7.2.4  | Add income record                  | Appears in list; summary updates |
| 7.2.5  | Add expense record                 | Appears in list; summary updates |
| 7.2.6  | Add record without required fields | Validation error shown           |
| 7.2.7  | Edit record                        | Updated values reflected         |
| 7.2.8  | Delete record                      | Removed from list                |
| 7.2.9  | Summary card — net total           | Correctly shows income − expense |
| 7.2.10 | Navigate to `/finance/categories`  | Categories page opens            |

---

## 8. Todos

### 8.1 Backend

| #     | Method | Endpoint                     | Auth                 | Expected                                           |
| ----- | ------ | ---------------------------- | -------------------- | -------------------------------------------------- |
| 8.1.1 | GET    | `/api/todos`                 | Valid token          | `200` → own todos only                             |
| 8.1.2 | GET    | `/api/todos?status=pending`  | Valid token          | Only pending todos                                 |
| 8.1.3 | GET    | `/api/todos?date=2026-02-28` | Valid token          | Todos for that due date                            |
| 8.1.4 | GET    | `/api/todos`                 | No token             | `401`                                              |
| 8.1.5 | POST   | `/api/todos`                 | Valid token          | `{ title, priority, due_date }` → `201` → `{ id }` |
| 8.1.6 | POST   | `/api/todos`                 | Valid token          | Missing `title` → `400`                            |
| 8.1.7 | PUT    | `/api/todos/:id`             | Own token            | Update `status` to `done` → `200`                  |
| 8.1.8 | PUT    | `/api/todos/:id`             | Different user token | Should not update (user_id check)                  |
| 8.1.9 | DELETE | `/api/todos/:id`             | Own token            | `200`                                              |

### 8.2 Frontend — Todos Page (`/todos`)

| #     | Test                             | Expected                                     |
| ----- | -------------------------------- | -------------------------------------------- |
| 8.2.1 | Page loads                       | Todos listed                                 |
| 8.2.2 | Create todo (valid)              | Appears in list with correct priority/status |
| 8.2.3 | Create without title             | Validation error shown                       |
| 8.2.4 | Mark todo as `done`              | Status badge updates                         |
| 8.2.5 | Status filter                    | Shows only matching status                   |
| 8.2.6 | Edit todo title/description      | Updated values displayed                     |
| 8.2.7 | Delete todo                      | Removed from list                            |
| 8.2.8 | Priority badge (low/medium/high) | Correct color/label                          |

---

## 9. Dashboard

### 9.1 Frontend — Dashboard (`/`)

| #     | Test                      | Expected                                         |
| ----- | ------------------------- | ------------------------------------------------ |
| 9.1.1 | Page loads authenticated  | Summary cards rendered                           |
| 9.1.2 | "Open todos" count        | Matches pending + in_progress todos from API     |
| 9.1.3 | Monthly income vs expense | Matches `/api/finance/summary` for current month |
| 9.1.4 | Total businesses tracked  | Reflects business count                          |
| 9.1.5 | Follow-up due today       | Businesses with `next_followup = today` shown    |

---

## 10. Navigation & Layout

| #    | Test                                     | Expected                                                  |
| ---- | ---------------------------------------- | --------------------------------------------------------- |
| 10.1 | Sidebar renders all nav items            | Businesses, Finance, Todos links present                  |
| 10.2 | Admin-only "Users" nav item              | Visible for admin; hidden for employee                    |
| 10.3 | Logout action                            | Token cleared from `localStorage`; redirected to `/login` |
| 10.4 | Direct URL to `/admin/users` as employee | Redirected to Dashboard                                   |
| 10.5 | Unauthenticated direct URL to `/finance` | Redirected to `/login`                                    |
| 10.6 | Unknown route (e.g. `/xyz`)              | Redirected to `/`                                         |

---

## 11. Security & Edge Cases

| #     | Test                                               | Expected                                  |
| ----- | -------------------------------------------------- | ----------------------------------------- |
| 11.1  | Employee cannot delete any business                | `403` on `DELETE /api/businesses/:id`     |
| 11.2  | Employee cannot access `/api/users`                | `403`                                     |
| 11.3  | User cannot read another user's finance records    | Records filtered by `user_id` server-side |
| 11.4  | User cannot delete another user's todo             | `user_id` scoped delete returns no match  |
| 11.5  | User cannot delete another user's finance category | `user_id` scoped delete                   |
| 11.6  | SQL injection in login email field                 | Returns `401` / no DB error               |
| 11.7  | Very long string in business name                  | DB truncation or `400`                    |
| 11.8  | Negative `amount` in finance record                | Check if DB or API rejects                |
| 11.9  | Invalid `status` enum on business PUT              | DB constraint should reject               |
| 11.10 | Invalid `outcome` enum on cold call POST           | DB constraint should reject               |

---

## 12. Integration Smoke Test (End-to-End Flow)

Run these in sequence to verify the full happy path:

1. `POST /api/auth/login` with admin creds → save token A
2. `POST /api/users` (token A) → create employee → save employee token E (login again)
3. `POST /api/businesses` (token E) → create business, save `biz_id`
4. `POST /api/businesses/:biz_id/calls` (token E) → log a call
5. `PUT /api/coldcalls/:call_id` (token E) → update outcome
6. `GET /api/businesses` (token A) → confirm biz appears in admin list
7. `POST /api/finance/categories` (token E) → create "Salary" income category
8. `POST /api/finance/records` (token E) → add income record using that category
9. `GET /api/finance/summary` (token E) → confirm income total
10. `POST /api/todos` (token E) → create a todo
11. `PUT /api/todos/:id` (token E) → mark as `done`
12. `DELETE /api/businesses/:biz_id` (token E) → expect `403` (employee cannot delete)
13. `DELETE /api/businesses/:biz_id` (token A) → expect `200`
14. `DELETE /api/users/:employee_id` (token A) → expect `200`

---

## 13. Known Gaps / Items to Verify

| Item                                                                                  | Notes                                                                         |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `PUT /api/coldcalls/:id` via `/api/coldcalls` route (not `/api/businesses/:id/calls`) | Confirm both route paths work as expected                                     |
| Finance summary `net` calculation                                                     | Verify `income - expense` computed server-side in `financeService.getSummary` |
| `updated_at` on todos                                                                 | Verify auto-update on PUT                                                     |
| Password not returned in `GET /api/auth/me` response                                  | `authService.findById` should exclude password                                |
| `assigned_to` vs `added_by` on businesses                                             | Confirm employee filtering uses the correct column                            |
| Token expiry (`7d`)                                                                   | Test behaviour after expiry — API returns `401`, frontend redirects to login  |
