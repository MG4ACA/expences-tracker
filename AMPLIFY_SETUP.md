# Amplify Backend Setup Guide (Phase 2)

## Prerequisites

Before initializing Amplify, ensure you have:

1. **AWS Account** — Create one at https://aws.amazon.com
2. **AWS CLI** — Install from https://aws.amazon.com/cli/
3. **Amplify CLI** — Install via: `npm install -g @aws-amplify/cli`
4. **Configured AWS Credentials** — Run: `aws configure`

## Initialization Steps

### 1. Initialize Amplify Project

```bash
cd c:\Mithuranga\expence-tracker\app
amplify init
```

**Configuration Answers:**

- **Project name:** `expensetracker`
- **Environment name:** `dev`
- **Default editor:** `Visual Studio Code` (or your preferred editor)
- **App type:** `javascript`
- **JavaScript framework:** `vue`
- **Source directory path:** `app`
- **Distribution directory path:** `.nuxt`
- **Build command:** `npm run build`
- **Start command:** `npm run dev`
- **AWS Profile:** Use default or select your configured profile

### 2. Push Backend to AWS

```bash
amplify push
```

**Prompts:**

- **Continue?** → `Y`
- **Generate API code?** → `Y`
- **File conflict?** → Overwrite if prompted

This will:

- Create AWS resources (Cognito User Pool, AppSync API, DynamoDB tables)
- Generate `amplify_outputs.json` with backend configuration
- Generate GraphQL operations and types

### 3. Verify Deployment

Check Amplify console:

```bash
amplify console
```

Or visit AWS Cognito console to verify User Pool was created.

## What Was Created

### Auth (Cognify User Pools)

- Email-based sign-up and sign-in
- Optional MFA support
- Password policy: 8+ chars, 1 uppercase, 1 lowercase, 1 number
- Email account recovery

### Data Models (GraphQL API)

- **UserProfile** — User metadata
- **Account** — Bank accounts/wallets
- **Category** — Expense/Income categories
- **Transaction** — Individual transactions

All models use owner-based authorization (users see only their data).

## Testing the Setup

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Navigate to Sign Up

Go to http://localhost:3000/auth/signup and create a test account.

### 3. Test Sign In/Out

After sign-up, test sign-in functionality and sign-out button in header.

### 4. Check User in Cognito

Visit AWS Cognito console → User Pools → expensetracker → Users to see your test account.

## Next Steps

1. **Update Stores** — Wire Pinia stores to Amplify Data Client
2. **Implement Data Sync** — Fetch/create transactions via Amplify
3. **Add Real-time** — Subscribe to transaction updates
4. **Build Reports** — Add analytics and charts

## Troubleshooting

### "amplify: command not found"

```bash
npm install -g @aws-amplify/cli
```

### "No credentials provided"

```bash
aws configure
```

### "Backend initialization failed"

- Check AWS region (us-east-1 recommended for phase 2)
- Verify AWS credentials have sufficient permissions
- Check internet connection

### "Build or distribution directory not found"

- Ensure paths are relative to project root
- `.nuxt` is generated during `npm run build`

## Cost Estimates (Phase 2)

AWS services used:

- **Cognito User Pool** — Free tier: 50k monthly active users
- **AppSync** — Free tier: 25k queries/month
- **DynamoDB** — Free tier: 25GB storage, 25 R/W units

For development, costs should be minimal or free with free tier.

## References

- [Amplify Getting Started](https://docs.amplify.aws/gen2/start/quickstart/)
- [Amplify Auth Docs](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [Amplify Data Docs](https://docs.amplify.aws/gen2/build-a-backend/data/)
