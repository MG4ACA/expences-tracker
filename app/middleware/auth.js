// middleware/auth.js
// Middleware to protect routes that require authentication

import { useAuth } from '@/composables/useAuth';
import { useTransactionsStore } from '@/stores/transactions';
import { useAccountsStore } from '@/stores/accounts';
import { useCategoriesStore } from '@/stores/categories';

export default defineRouteMiddleware(async (to, from) => {
  const { isAuthenticated, initializeAuth, userId } = useAuth();

  // Initialize auth state if not already done
  if (!isAuthenticated.value) {
    await initializeAuth();
  }

  // Check if route requires authentication (all routes except /auth/*)
  const isAuthRoute = to.path.startsWith('/auth/');
  const requiresAuth = !isAuthRoute;

  if (requiresAuth && !isAuthenticated.value) {
    // Redirect to sign-in if trying to access protected route
    return navigateTo('/auth/signin');
  }

  // Load user data if authenticated and moving to protected route
  if (isAuthenticated.value && requiresAuth && userId.value) {
    const transactionsStore = useTransactionsStore();
    const accountsStore = useAccountsStore();
    const categoriesStore = useCategoriesStore();

    // Load stores if not already loaded
    if (transactionsStore.items.length === 0 && !transactionsStore.isLoading) {
      await transactionsStore.loadTransactions();
    }
    if (accountsStore.items.length === 0 && !accountsStore.isLoading) {
      await accountsStore.loadAccounts();
    }
    if (categoriesStore.items.length === 0 && !categoriesStore.isLoading) {
      await categoriesStore.loadCategories();
    }
  }
  }

  if (isAuthRoute && isAuthenticated.value) {
    // Redirect to dashboard if already authenticated and trying to access auth pages
    return navigateTo('/');
  }
});
