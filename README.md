# Lumicore Tracker — Quick Start

## Prerequisites

- Node.js 18+
- MySQL 8+

## 1. Database Setup

Open MySQL and run:

```bash
mysql -u root -p < backend/database.sql
```

This creates the `lumicore_tracker` database, all tables, and a default admin user:

- **Email:** `admin@lumicorelabs.com`
- **Password:** `admin123`

> Change the admin password immediately after first login via Admin → Users.

## 2. Backend

```bash
cd backend
cp .env.example .env       # Edit .env with your MySQL credentials
npm install
npm run dev                # Starts on http://localhost:3000
```

Edit `backend/.env`:

```
DB_PASSWORD=your_mysql_password
JWT_SECRET=any_long_random_string
```

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                # Starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Project Structure

```
expence-tracker/
├── backend/
│   ├── database.sql        ← Run this first
│   ├── .env                ← Your config
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── middleware/auth.js
│       └── routes/         ← auth, users, businesses, finance, todos
└── frontend/
    └── src/
        ├── views/          ← All pages
        ├── api/            ← Axios service files
        ├── stores/auth.js  ← Pinia auth store
        └── router/         ← Vue Router config
```

## Default Credentials

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | admin@lumicorelabs.com |
| Password | admin123               |
| Role     | Admin                  |
