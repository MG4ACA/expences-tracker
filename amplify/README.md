# Amplify Data Schema Setup

## Overview

This directory contains the AWS Amplify Data schema definition for the Expense Tracker application. The schema defines the data models and relationships for managing transactions, accounts, categories, and user profiles.

## Schema Structure

### Models

#### UserProfile

- Central entity representing a user
- Stores user information and currency preference (default: LKR)
- Has relationships to Account, Category, and Transaction models

#### Account

- Represents user bank accounts, wallets, or credit cards
- Types: CASH, BANK, CREDIT_CARD, SAVINGS
- Tracks account balance and currency
- Belongs to UserProfile

#### Category

- Represents transaction categories
- Types: INCOME or EXPENSE
- Supports color and icon customization
- Belongs to UserProfile

#### Transaction

- Core transaction record
- Tracks amount, type (INCOME/EXPENSE), date, and notes
- References Account, Category, and UserProfile
- Supports filtering by all related entities

## Authorization

All models use owner-based authorization via AWS Cognito User Pools:

- Users can only access their own data
- CRUD operations restricted to data owners

## Next Steps (Phase 2)

1. **Deploy Amplify Backend**

   ```bash
   amplify push
   ```

2. **Generate GraphQL Operations**

   ```bash
   amplify codegen
   ```

3. **Wire Stores to Amplify**
   - Update Pinia stores to use Amplify Data Client
   - Replace local state with backend data queries
   - Implement real-time subscriptions

4. **Add Authentication**
   - Implement user sign-up/sign-in
   - Integrate with Cognito User Pools
   - Manage user context in stores

## File Structure

```
amplify/
├── backend.ts          # Backend configuration entry point
├── data/
│   └── resource.ts     # GraphQL schema definition
└── types.ts            # Auto-generated TypeScript types
```

## Development Notes

- `amplify/data/resource.ts` defines the GraphQL schema using Amplify Data DSL
- Models include date tracking (createdAt, updatedAt) for audit trails
- Relationships use one-to-many (hasMany/belongsTo) patterns
- No pagination configuration yet (Phase 2 enhancement)

## References

- [AWS Amplify Data Documentation](https://docs.amplify.aws/gen2/build-a-backend/data/)
- [GraphQL Authorization Patterns](https://docs.amplify.aws/gen2/build-a-backend/data/authorization/)
