-- Simple Sample Data Insert for Expense Tracker
-- Run this in Supabase SQL Editor
-- It will automatically find your user and add sample data

-- Step 1: Get the first user ID
WITH user_data AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
),

-- Step 2: Insert sample accounts
accounts_insert AS (
  INSERT INTO accounts (user_id, name, type, balance, currency)
  SELECT
    u.id,
    data.name,
    data.type,
    data.balance,
    'LKR'
  FROM user_data u
  CROSS JOIN (
    VALUES
      ('Checking Account', 'BANK', 50000.00),
      ('Savings Account', 'BANK', 100000.00),
      ('Cash Wallet', 'CASH', 10000.00)
  ) AS data(name, type, balance)
  WHERE NOT EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.user_id = u.id AND a.name = data.name
  )
  RETURNING id, user_id
),

-- Step 3: Ensure we have categories (created during signup)
categories_data AS (
  SELECT id, user_id, name FROM categories
  WHERE user_id = (SELECT id FROM user_data)
  LIMIT 10
),

-- Step 4: Get account IDs for transactions
account_data AS (
  SELECT id, user_id FROM accounts
  WHERE user_id = (SELECT id FROM user_data)
  LIMIT 1
)

-- Step 5: Insert sample transactions
INSERT INTO transactions (
  user_id,
  account_id,
  category_id,
  amount,
  type,
  description,
  transaction_date
)
SELECT
  u.id,
  a.id,
  c.id,
  t.amount,
  t.type,
  t.description,
  t.date
FROM user_data u
CROSS JOIN account_data a
CROSS JOIN (
  SELECT
    category_name,
    type,
    amount,
    description,
    date
  FROM (
    VALUES
      ('Salary', 'INCOME', 150000.00, 'Monthly salary', NOW() - INTERVAL '30 days'),
      ('Groceries', 'EXPENSE', 5000.00, 'Weekly groceries', NOW() - INTERVAL '25 days'),
      ('Transport', 'EXPENSE', 2000.00, 'Taxi rides', NOW() - INTERVAL '20 days'),
      ('Entertainment', 'EXPENSE', 3500.00, 'Movie tickets', NOW() - INTERVAL '15 days'),
      ('Utilities', 'EXPENSE', 8000.00, 'Electricity bill', NOW() - INTERVAL '10 days'),
      ('Bonus', 'INCOME', 25000.00, 'Performance bonus', NOW() - INTERVAL '5 days'),
      ('Groceries', 'EXPENSE', 4500.00, 'Weekly groceries', NOW() - INTERVAL '3 days'),
      ('Transport', 'EXPENSE', 1500.00, 'Bus fare', NOW() - INTERVAL '2 days'),
      ('Entertainment', 'EXPENSE', 2000.00, 'Dinner out', NOW())
  ) AS sample_txns(category_name, type, amount, description, date)
) AS t(category_name, type, amount, description, date)
CROSS JOIN categories c
WHERE c.user_id = u.id
  AND c.name = t.category_name
  AND NOT EXISTS (
    SELECT 1 FROM transactions tx
    WHERE tx.user_id = u.id
      AND tx.description = t.description
      AND tx.category_id = c.id
  )
ON CONFLICT DO NOTHING;

-- Display results
SELECT 
  'Accounts' as type,
  COUNT(*) as count
FROM accounts
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)

UNION ALL

SELECT 
  'Categories' as type,
  COUNT(*) as count
FROM categories
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)

UNION ALL

SELECT 
  'Transactions' as type,
  COUNT(*) as count
FROM transactions
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);
