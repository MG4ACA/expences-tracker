// composables/useSupabaseData.js
// Composable for Supabase database operations

import { ref } from 'vue';

export const useSupabaseData = () => {
  const { $supabase } = useNuxtApp();

  const isLoading = ref(false);
  const error = ref(null);

  // Transactions
  const listTransactions = async (userId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase
        .from('transactions')
        .select(
          `
          id,
          amount,
          type,
          description,
          notes,
          transaction_date,
          created_at,
          account_id,
          category_id,
          accounts (id, name, type),
          categories (id, name, type, color)
        `,
        )
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (err) throw err;
      return data || [];
    } catch (err) {
      error.value = err.message;
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const createTransaction = async (payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase.from('transactions').insert([payload]).select();

      if (err) throw err;
      return data?.[0] || null;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateTransaction = async (id, payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .select();

      if (err) throw err;
      return data?.[0] || null;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteTransaction = async (id) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { error: err } = await $supabase.from('transactions').delete().eq('id', id);

      if (err) throw err;
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Categories
  const listCategories = async (userId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (err) throw err;
      return data || [];
    } catch (err) {
      error.value = err.message;
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const createCategory = async (payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase.from('categories').insert([payload]).select();

      if (err) throw err;
      return data?.[0] || null;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateCategory = async (id, payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select();

      if (err) throw err;
      return data?.[0] || null;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteCategory = async (id) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { error: err } = await $supabase.from('categories').delete().eq('id', id);

      if (err) throw err;
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Accounts
  const listAccounts = async (userId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (err) throw err;
      return data || [];
    } catch (err) {
      error.value = err.message;
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const createAccount = async (payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase.from('accounts').insert([payload]).select();

      if (err) throw err;
      return data?.[0] || null;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateAccount = async (id, payload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase
        .from('accounts')
        .update(payload)
        .eq('id', id)
        .select();

      if (err) throw err;
      return data?.[0] || null;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAccount = async (id) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { error: err } = await $supabase.from('accounts').delete().eq('id', id);

      if (err) throw err;
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Real-time subscription
  const subscribeToTransactions = (userId, callback) => {
    return $supabase
      .channel(`transactions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  };

  return {
    isLoading,
    error,
    // Transactions
    listTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    // Categories
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // Accounts
    listAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    // Real-time
    subscribeToTransactions,
  };
};
