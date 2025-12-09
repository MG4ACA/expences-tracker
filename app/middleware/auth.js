// middleware/auth.js
// Middleware to protect routes that require authentication

import { useAuth } from '@/composables/useAuth';

export default defineRouteMiddleware(async (to, from) => {
  const { isAuthenticated, initializeAuth } = useAuth();

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

  if (isAuthRoute && isAuthenticated.value) {
    // Redirect to dashboard if already authenticated and trying to access auth pages
    return navigateTo('/');
  }
});
