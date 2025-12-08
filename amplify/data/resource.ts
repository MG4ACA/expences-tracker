import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // UserProfile - stores user information
  UserProfile: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      email: a.email().required(),
      currency: a.string().default('LKR'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relations
      accounts: a.hasMany('Account', 'userProfileId'),
      categories: a.hasMany('Category', 'userProfileId'),
      transactions: a.hasMany('Transaction', 'userProfileId'),
    })
    .authorization((allow) => [allow.owner()]),

  // Account - stores user bank accounts / wallets
  Account: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      type: a.enum(['CASH', 'BANK', 'CREDIT_CARD', 'SAVINGS']),
      balance: a.float(),
      currency: a.string().default('LKR'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relations
      userProfileId: a.id().required(),
      userProfile: a.belongsTo('UserProfile', 'userProfileId'),
      transactions: a.hasMany('Transaction', 'accountId'),
    })
    .authorization((allow) => [allow.owner().to(['read', 'create', 'update', 'delete'])]),

  // Category - stores transaction categories
  Category: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      type: a.enum(['INCOME', 'EXPENSE']).required(),
      color: a.string(),
      icon: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relations
      userProfileId: a.id().required(),
      userProfile: a.belongsTo('UserProfile', 'userProfileId'),
      transactions: a.hasMany('Transaction', 'categoryId'),
    })
    .authorization((allow) => [allow.owner().to(['read', 'create', 'update', 'delete'])]),

  // Transaction - stores income and expense transactions
  Transaction: a
    .model({
      id: a.id().required(),
      amount: a.float().required(),
      type: a.enum(['INCOME', 'EXPENSE']).required(),
      description: a.string(),
      notes: a.string(),
      transactionDate: a.datetime().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relations
      userProfileId: a.id().required(),
      userProfile: a.belongsTo('UserProfile', 'userProfileId'),
      accountId: a.id().required(),
      account: a.belongsTo('Account', 'accountId'),
      categoryId: a.id().required(),
      category: a.belongsTo('Category', 'categoryId'),
    })
    .authorization((allow) => [allow.owner().to(['read', 'create', 'update', 'delete'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
