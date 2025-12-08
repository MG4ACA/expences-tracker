// composables/useAmplifyData.js
// This composable provides Amplify Data integration for the expense tracker
// It wraps Amplify Data Client methods for consistent use across components

import { generateClient } from 'aws-amplify/api';
import { ref } from 'vue';

let amplifyClient = null;

export const useAmplifyData = () => {
  const isLoading = ref(false);
  const error = ref(null);

  // Initialize Amplify client (lazy initialization)
  const getClient = () => {
    if (!amplifyClient) {
      amplifyClient = generateClient();
    }
    return amplifyClient;
  };

  // Transaction operations
  const createTransaction = async (payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = getClient();
      // Once Amplify Data is configured, replace with:
      // const result = await client.models.Transaction.create(payload);
      console.log('Creating transaction:', payload);
      return payload;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating transaction:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const listTransactions = async (userProfileId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = getClient();
      // Once Amplify Data is configured, replace with:
      // const result = await client.models.Transaction.listByUserProfileId({ userProfileId });
      console.log('Listing transactions for user:', userProfileId);
      return [];
    } catch (err) {
      error.value = err.message;
      console.error('Error listing transactions:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Category operations
  const createCategory = async (payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = getClient();
      // Once Amplify Data is configured, replace with:
      // const result = await client.models.Category.create(payload);
      console.log('Creating category:', payload);
      return payload;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating category:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const listCategories = async (userProfileId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = getClient();
      // Once Amplify Data is configured, replace with:
      // const result = await client.models.Category.listByUserProfileId({ userProfileId });
      console.log('Listing categories for user:', userProfileId);
      return [];
    } catch (err) {
      error.value = err.message;
      console.error('Error listing categories:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Account operations
  const createAccount = async (payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = getClient();
      // Once Amplify Data is configured, replace with:
      // const result = await client.models.Account.create(payload);
      console.log('Creating account:', payload);
      return payload;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating account:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const listAccounts = async (userProfileId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = getClient();
      // Once Amplify Data is configured, replace with:
      // const result = await client.models.Account.listByUserProfileId({ userProfileId });
      console.log('Listing accounts for user:', userProfileId);
      return [];
    } catch (err) {
      error.value = err.message;
      console.error('Error listing accounts:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    getClient,
    createTransaction,
    listTransactions,
    createCategory,
    listCategories,
    createAccount,
    listAccounts,
  };
};
