// composables/useAuth.js
// Authentication context composable using Supabase

import { computed, ref } from 'vue';

// Global auth state
const currentUser = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const error = ref(null);
const userId = ref(null);

export const useAuth = () => {
  const { $supabase } = useNuxtApp();

  // Initialize auth state on app load
  const initializeAuth = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const {
        data: { user },
        error: err,
      } = await $supabase.auth.getUser();

      if (err) throw err;

      if (user) {
        currentUser.value = user;
        isAuthenticated.value = true;
        userId.value = user.id;
        return user;
      }
    } catch (err) {
      // User not authenticated
      currentUser.value = null;
      isAuthenticated.value = false;
      userId.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  // Sign up new user
  const handleSignUp = async (email, password, name = '') => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase.auth.signUp({
        email,
        password,
      });

      if (err) throw err;

      // Create default categories for new user
      if (data.user) {
        const defaultCategories = [
          { name: 'Groceries', type: 'EXPENSE', color: '#22c55e', icon: 'shopping-bag' },
          { name: 'Transport', type: 'EXPENSE', color: '#3b82f6', icon: 'car' },
          { name: 'Entertainment', type: 'EXPENSE', color: '#ec4899', icon: 'film' },
          { name: 'Utilities', type: 'EXPENSE', color: '#f59e0b', icon: 'zap' },
          { name: 'Salary', type: 'INCOME', color: '#10b981', icon: 'briefcase' },
          { name: 'Bonus', type: 'INCOME', color: '#06b6d4', icon: 'gift' },
        ];

        const defaultAccounts = [
          { name: 'Cash', type: 'CASH', balance: 0, currency: 'LKR' },
          { name: 'Bank Account', type: 'BANK', balance: 0, currency: 'LKR' },
        ];

        try {
          // Insert default categories
          for (const cat of defaultCategories) {
            await $supabase.from('categories').insert({
              user_id: data.user.id,
              ...cat,
            });
          }

          // Insert default accounts
          for (const acc of defaultAccounts) {
            await $supabase.from('accounts').insert({
              user_id: data.user.id,
              ...acc,
            });
          }
        } catch (setupErr) {
          console.warn('Failed to create default data:', setupErr);
          // Don't throw - signup was successful even if default data failed
        }
      }

      // Note: Email confirmation may be required depending on Supabase settings
      return data;
    } catch (err) {
      error.value = err.message || 'Sign up failed';
      console.error('Sign up error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Sign in user
  const handleSignIn = async (email, password) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await $supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) throw err;

      await initializeAuth();
      return data;
    } catch (err) {
      error.value = err.message || 'Sign in failed';
      console.error('Sign in error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Sign out user
  const handleSignOut = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const { error: err } = await $supabase.auth.signOut();

      if (err) throw err;

      currentUser.value = null;
      isAuthenticated.value = false;
      userId.value = null;
      return true;
    } catch (err) {
      error.value = err.message || 'Sign out failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Computed properties
  const user = computed(() => currentUser.value);
  const isLoggedIn = computed(() => isAuthenticated.value);
  const userName = computed(() => currentUser.value?.email?.split('@')[0] || '');
  const userEmail = computed(() => currentUser.value?.email || '');

  return {
    // State
    currentUser: user,
    isAuthenticated: isLoggedIn,
    isLoading,
    error,
    userId,
    // Computed
    userName,
    userEmail,
    // Methods
    initializeAuth,
    handleSignUp,
    handleSignIn,
    handleSignOut,
  };
};
