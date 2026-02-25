# Supabase Setup Guide (Phase 2)

## Why Supabase?

Supabase is an open-source Firebase alternative with PostgreSQL as the backbone:

- **Simple** — No complex CLI wizards, just SQL and REST API
- **PostgreSQL** — Full SQL power with JSON/JSONB support
- **Real-time** — Built-in real-time subscriptions via WebSockets
- **Auth** — User management with email/password, OAuth, MFA
- **Cost-effective** — Free tier: 500MB database, unlimited API calls
- **Vue-friendly** — Minimal boilerplate, great TypeScript support
- **Full control** — Own your data, standard PostgreSQL

## Prerequisites

1. **Supabase Account** — Sign up free at https://supabase.com
2. **Node.js 18+** — For Supabase client
3. **Git** — For version control

## Getting Started

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Choose project name: `expense-tracker`
4. Set password (save this!)
5. Select region: `us-east-1` (or closest to you)
6. Click **"Create new project"** (takes 2-3 minutes)

### 2. Get Connection Details

Once project is ready:

1. Go to **Settings** → **Database** → **Connection Info**
2. Copy your credentials:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Public key for client-side auth
   - **Service Role Key**: Secret key for server-side operations

### 3. Create Database Tables

Go to **SQL Editor** and run this SQL:

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

-- Create indexes for performance
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

-- Create RLS policies for accounts
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

-- Create RLS policies for categories
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

-- Create RLS policies for transactions
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

### 4. Set Up Authentication

In Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (default)
3. Go to **Settings** → **Email Templates**
4. (Optional) Customize welcome email

### 5. Configure Frontend

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
    },
  },
});
```

## Supabase Client Setup

Already created in `app/plugins/supabase.client.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const config = useRuntimeConfig();

export const supabase = createClient(config.public.supabaseUrl, config.public.supabaseKey);
```

Available in composables and components via:

```javascript
import { supabase } from '@/plugins/supabase.client';
```

## Common Operations

### Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});
```

### Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
});
```

### Fetch Data

```javascript
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .order('transaction_date', { ascending: false });
```

### Insert Data

```javascript
const { data, error } = await supabase.from('transactions').insert([
  {
    user_id: userId,
    account_id: accountId,
    category_id: categoryId,
    amount: 5000,
    type: 'EXPENSE',
    description: 'Groceries',
    transaction_date: new Date().toISOString(),
  },
]);
```

### Real-time Subscription

```javascript
const subscription = supabase
  .channel('transactions')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'transactions',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Real-time update:', payload);
    },
  )
  .subscribe();
```

## Advantages Over Amplify

| Feature          | Amplify                 | Supabase                |
| ---------------- | ----------------------- | ----------------------- |
| Setup Time       | 30+ mins                | 5 mins                  |
| Database         | DynamoDB (NoSQL)        | PostgreSQL (SQL)        |
| Complexity       | High (AWS ecosystem)    | Low (simple & familiar) |
| Cost (free tier) | 50k users               | Unlimited users         |
| Real-time        | Limited                 | Built-in, fast          |
| SQL Power        | None (no SQL)           | Full PostgreSQL         |
| Learning Curve   | Steep                   | Shallow                 |
| CLI              | Required                | Optional                |
| Documentation    | Extensive but complex   | Concise & clear         |
| UI Editing       | AWS Console (confusing) | Supabase UI (intuitive) |

## Next Steps

1. Create Supabase project ✓
2. Copy credentials to `.env.local`
3. Run migration SQL in SQL Editor
4. Update auth composable to use Supabase
5. Update stores to use Supabase client
6. Test auth flow
7. Test CRUD operations

## Supabase Resources

- [Official Docs](https://supabase.com/docs)
- [JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Real-time Docs](https://supabase.com/docs/guides/real-time)
- [SQL Examples](https://supabase.com/docs/guides/database)
- [Free Tier Details](https://supabase.com/pricing)

## Cost Estimate

- **Free Tier**: Up to 500MB database, unlimited API calls, 2 concurrent auth users
- **Pro Tier** ($25/mo): 8GB database, 100,000 monthly active users
- Perfect for hobby and small business projects

For Phase 2 MVP, the free tier is more than enough!
