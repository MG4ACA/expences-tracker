// composables/useAuth.js
// Authentication context composable for managing user auth state and operations

import { getCurrentUser, signIn, signOut, signUp } from 'aws-amplify/auth';
import { computed, ref } from 'vue';

// Global auth state
const currentUser = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const error = ref(null);
const userProfileId = ref(null);

export const useAuth = () => {
  // Initialize auth state on app load
  const initializeAuth = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const user = await getCurrentUser();
      currentUser.value = user;
      isAuthenticated.value = true;
      // Extract userProfileId from user attributes (matches email for now)
      userProfileId.value = user.userId;
      return user;
    } catch (err) {
      // User not authenticated
      currentUser.value = null;
      isAuthenticated.value = false;
      userProfileId.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  // Sign up new user
  const handleSignUp = async (email, password, name = '') => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: name || email,
            preferred_username: email.split('@')[0],
          },
        },
      });
      return result;
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
      const result = await signIn({
        username: email,
        password,
      });
      await initializeAuth();
      return result;
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
      await signOut();
      currentUser.value = null;
      isAuthenticated.value = false;
      userProfileId.value = null;
      return true;
    } catch (err) {
      error.value = err.message || 'Sign out failed';
      console.error('Sign out error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Computed properties
  const user = computed(() => currentUser.value);
  const isLoggedIn = computed(() => isAuthenticated.value);
  const userName = computed(() => currentUser.value?.signInDetails?.loginId || '');
  const userEmail = computed(() => currentUser.value?.attributes?.email || '');

  return {
    // State
    currentUser: user,
    isAuthenticated: isLoggedIn,
    isLoading,
    error,
    userProfileId,
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
