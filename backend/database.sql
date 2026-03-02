-- Lumicore Tracker — Database Schema
-- Run this file once to initialize the database

CREATE DATABASE IF NOT EXISTS lumicore_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lumicore_tracker;

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'employee') DEFAULT 'employee',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- Businesses
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(200) NOT NULL,
  type            VARCHAR(100),
  phone           VARCHAR(50),
  address         TEXT,
  city            VARCHAR(100),
  google_maps_url TEXT,
  website         VARCHAR(255),
  status          ENUM('new', 'contacted', 'interested', 'rejected', 'converted') DEFAULT 'new',
  assigned_to     INT,
  added_by        INT,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (added_by)    REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- Cold Calls
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cold_calls (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  business_id   INT NOT NULL,
  called_by     INT,
  call_date     DATE NOT NULL,
  outcome       ENUM('no_answer', 'not_interested', 'callback', 'interested', 'converted'),
  notes         TEXT,
  next_followup DATE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (called_by)   REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- Finance Categories
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  type        ENUM('income', 'expense') NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Finance Records
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_records (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT NOT NULL,
  category_id   INT,
  type          ENUM('income', 'expense') NOT NULL,
  amount        DECIMAL(10, 2) NOT NULL,
  description   VARCHAR(255),
  date          DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- Todos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS todos (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  status        ENUM('pending', 'in_progress', 'done') DEFAULT 'pending',
  priority      ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date      DATE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Default admin user  (password: admin123)
-- Change password immediately after first login!
-- ─────────────────────────────────────────────
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@lumicorelabs.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHO', 'admin');

-- Default finance categories for the admin
INSERT INTO finance_categories (user_id, name, type) VALUES
(1, 'Projects', 'income'),
(1, 'Freelancing', 'income'),
(1, 'House Rent', 'income'),
(1, 'Transport', 'expense'),
(1, 'Utility Bills', 'expense'),
(1, 'Liquor', 'expense'),
(1, 'Smoking', 'expense'),
(1, 'Food', 'expense');

-- ─────────────────────────────────────────────
-- VPS Servers
-- Stores the VPS hosts where client apps are deployed.
-- New VPS hosts can be added as the business grows.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vps_servers (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  label       VARCHAR(100) NOT NULL,          -- e.g. "Hostinger VPS 1"
  host        VARCHAR(255) NOT NULL,           -- IP or hostname
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- Deployments
-- Tracks PM2 server deployments per business.
-- Phase 2: agent_secret is used by a VPS agent script
--          to POST live status updates to /api/deployments/agent/status.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deployments (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  business_id   INT NOT NULL,
  vps_id        INT,
  pm2_app_name  VARCHAR(100) NOT NULL,          -- PM2 process name
  port          SMALLINT UNSIGNED NOT NULL,      -- exposed port
  vps_path      VARCHAR(255),                   -- /var/www/x
  status        ENUM('online','offline','error','unknown') DEFAULT 'unknown',
  agent_secret  VARCHAR(64),                    -- Phase 2: VPS agent auth token
  last_seen_at  TIMESTAMP NULL DEFAULT NULL,    -- Phase 2: last agent ping time
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (vps_id)      REFERENCES vps_servers(id) ON DELETE SET NULL
);

-- Seed data is managed by Node.js seeders (backend/seeders/).
-- Run:  npm run seed
