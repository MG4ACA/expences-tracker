// This file is auto-generated and should not be modified manually.
// It contains the Amplify Data schema exports.

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Account = {
  id: string;
  name: string;
  type?: 'CASH' | 'BANK' | 'CREDIT_CARD' | 'SAVINGS';
  balance?: number;
  currency?: string;
  userProfileId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  userProfileId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  notes?: string;
  transactionDate: string;
  userProfileId: string;
  accountId: string;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
};
