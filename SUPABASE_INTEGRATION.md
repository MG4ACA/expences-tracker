# Supabase Integration Guide

## Quick Start (5 Minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name:** `expense-tracker`
   - **Password:** (save this!)
   - **Region:** `us-east-1` (or closest to you)
4. Click **"Create new project"** (wait 2-3 minutes)

### 2. Get Credentials

Once ready:

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon Key** (public key, safe to expose)

### 3. Add Credentials to Project

```bash
# Create .env.local file in project root (app/ directory)
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Create Database Tables

In Supabase dashboard:

1. Go to **SQL Editor** (left sidebar)
2. Create a new query
3. Paste this SQL and run it:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  currency TEXT DEFAULT 'LKR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('CASH', 'BANK', 'CREDIT_CARD', 'SAVINGS')),
  balance DECIMAL(12, 2),
  currency TEXT DEFAULT 'LKR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  description TEXT,
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Enable Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can see their own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can see their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can see their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. Test Connection

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Go to http://localhost:3000/auth/signup and create an account.

## Architecture

```
Frontend (Vue + Pinia)
        ↓
useAuth composable (Supabase Auth)
        ↓
useSupabaseData composable (Supabase Realtime API)
        ↓
Supabase Backend (PostgreSQL + Row Level Security)
```

## Key Files

- `app/plugins/supabase.client.js` — Supabase client initialization
- `app/composables/useAuth.js` — Auth operations (sign-up, sign-in, sign-out)
- `app/composables/useSupabaseData.js` — Database operations (CRUD for transactions, categories, accounts)
- `.env.local` — Supabase credentials (create from `.env.local.example`)

## Composable Usage

### Auth

```javascript
const { handleSignUp, handleSignIn, handleSignOut, userId } = useAuth();

// Sign up
await handleSignUp('user@example.com', 'password', 'John');

// Sign in
await handleSignIn('user@example.com', 'password');

// Get current user ID
console.log(userId.value);

// Sign out
await handleSignOut();
```

### Data

```javascript
const { listTransactions, createTransaction, userId } = useSupabaseData();

// Fetch transactions
const transactions = await listTransactions(userId.value);

// Create transaction
await createTransaction({
  user_id: userId.value,
  account_id: 'account-id',
  category_id: 'category-id',
  amount: 5000,
  type: 'EXPENSE',
  description: 'Groceries',
  transaction_date: new Date().toISOString(),
});
```

## Real-time Subscriptions

```javascript
const { subscribeToTransactions } = useSupabaseData();

subscribeToTransactions(userId.value, (payload) => {
  console.log('New/updated transaction:', payload.new);
});
```

## Row Level Security (RLS)

All tables have RLS enabled. Users can only see/modify their own data:

- `user_id` column automatically set to `auth.uid()`
- Queries filter by current user automatically
- No data leaks between users

## Troubleshooting

**"Supabase configuration missing"**

- Check `.env.local` exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

**"Auth users not matching users in table"**

- After sign-up, create user in `user_profiles` table (or do it manually in Supabase UI)
- Optional: Add trigger to auto-create on signup

**"RLS policies blocking queries"**

- Check RLS policies exist
- Verify `user_id` column matches `auth.uid()`
- Check Supabase logs for specific errors

## Next Steps

1. ✅ Create Supabase project
2. ✅ Create database tables and RLS policies
3. ✅ Add credentials to `.env.local`
4. ⬜ Update Pinia stores to use `useSupabaseData`
5. ⬜ Test CRUD operations
6. ⬜ Build reports page

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Real-time Guide](https://supabase.com/docs/guides/real-time)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
