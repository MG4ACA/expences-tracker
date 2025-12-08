# Amplify Data Integration Guide

This document outlines how to integrate AWS Amplify Data with the existing Pinia stores and Vue components.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Vue Components                         │
│              (TransactionForm, etc.)                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Pinia Stores                           │
│  (transactions.js, categories.js, accounts.js)         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            useAmplifyData Composable                    │
│     (amplify/composables/useAmplifyData.js)            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│          Amplify Data Client                            │
│    (GraphQL API to AWS AppSync / DynamoDB)             │
└─────────────────────────────────────────────────────────┘
```

## Integration Steps

### Phase 1: Current State (Local Pinia Stores)

- ✅ Components use Pinia stores
- ✅ Data stored in memory with seed data
- ✅ No backend persistence

### Phase 2: Amplify Integration (Planned)

#### Step 1: Initialize Amplify in main.ts

```javascript
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
```

#### Step 2: Update Pinia Stores

Each store (transactions, categories, accounts) should:

1. Import `useAmplifyData` composable
2. Initialize Amplify operations in `onMounted()`
3. Sync store state with Amplify data on app load
4. Call Amplify methods on data mutations (add/update/delete)

Example (transactions.js):

```javascript
import { useAmplifyData } from '@/composables/useAmplifyData';

export const useTransactionStore = defineStore('transaction', () => {
  const { createTransaction, listTransactions } = useAmplifyData();

  // On component mount: fetch data from Amplify
  const loadTransactions = async () => {
    const amplifyTransactions = await listTransactions(userProfileId);
    items.value = amplifyTransactions;
  };

  // On add: save to Amplify first, then update local state
  const addTransaction = async (txn) => {
    const created = await createTransaction({
      ...txn,
      userProfileId,
    });
    items.value.unshift(created);
  };
});
```

#### Step 3: Add Real-time Subscriptions

Use Amplify Data subscriptions to sync state across browser tabs:

```javascript
import { client } from '@/amplify/client';

const subscription = client.models.Transaction.onCreate().subscribe({
  next: (data) => {
    items.value.unshift(data);
  },
});
```

#### Step 4: Implement Authentication

- Add Cognito User Pool authentication
- Store `userProfileId` in auth context
- Pass it to all Amplify Data queries

### Data Migration Strategy

1. **Seed Data**: Create initial categories, accounts via Amplify mutations
2. **User Context**: Store `userProfileId` from Cognito after sign-in
3. **Backward Compatibility**: Keep local stores functional during transition
4. **Testing**: Test with mock data before deploying to AWS

## Key Methods in useAmplifyData

- `createTransaction(payload)` — Create new transaction
- `listTransactions(userProfileId)` — Fetch user's transactions
- `createCategory(payload)` — Create new category
- `listCategories(userProfileId)` — Fetch user's categories
- `createAccount(payload)` — Create new account
- `listAccounts(userProfileId)` — Fetch user's accounts

## Error Handling

The composable sets `isLoading` and `error` refs for UI feedback:

```javascript
const { isLoading, error } = useAmplifyData();

// In template:
<Button :loading="isLoading" />
<Toast v-if="error" :message="error" severity="error" />
```

## TypeScript Support

Auto-generated types in `amplify/types.ts`:

```typescript
import type { UserProfile, Transaction } from '@/amplify/types';
```

## Deployment Checklist

- [ ] Create AWS account and configure AWS CLI
- [ ] Run `amplify init` (answers pre-configured)
- [ ] Run `amplify push` to deploy backend
- [ ] Generate `amplify_outputs.json`
- [ ] Update `main.ts` with Amplify config
- [ ] Test CRUD operations
- [ ] Deploy frontend to Amplify Hosting (Phase 2)

## References

- [Amplify Data Guide](https://docs.amplify.aws/gen2/build-a-backend/data/)
- [Query/Mutation Examples](https://docs.amplify.aws/gen2/build-a-backend/data/connect-from-frontend/)
- [Authorization Patterns](https://docs.amplify.aws/gen2/build-a-backend/data/authorization/)
- [Real-time Subscriptions](https://docs.amplify.aws/gen2/build-a-backend/data/real-time/)
