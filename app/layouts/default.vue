<script setup>
  import { useAuth } from '@/composables/useAuth';
  import Button from 'primevue/button';
  import Toast from 'primevue/toast';
  import { useToast } from 'primevue/usetoast';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, userName, handleSignOut } = useAuth();
  const isMobileMenuOpen = ref(false);

  const toggleMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  };

  const onSignOut = async () => {
    try {
      await handleSignOut();
      toast.add({
        severity: 'info',
        summary: 'Signed Out',
        detail: 'You have been signed out',
        life: 2000,
      });
      router.push('/auth/signin');
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Sign Out Failed',
        detail: err.message,
        life: 3000,
      });
    }
  };
</script>

<template>
  <div class="et-shell">
    <header class="et-shell__header">
      <div class="et-shell__brand">Expense Tracker</div>
      <button class="et-menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
        <i :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
      </button>
      <nav class="et-shell__nav" :class="{ 'et-shell__nav--open': isMobileMenuOpen }">
        <NuxtLink to="/" @click="isMobileMenuOpen = false">Dashboard</NuxtLink>
        <NuxtLink to="/transactions" @click="isMobileMenuOpen = false">Transactions</NuxtLink>
        <NuxtLink to="/categories" @click="isMobileMenuOpen = false">Categories</NuxtLink>
        <NuxtLink to="/reports" @click="isMobileMenuOpen = false">Reports</NuxtLink>
      </nav>
      <div v-if="isAuthenticated" class="et-shell__user">
        <span class="et-user-name">{{ userName }}</span>
        <Button
          icon="pi pi-sign-out"
          rounded
          text
          severity="secondary"
          @click="onSignOut"
          v-tooltip="'Sign Out'"
        />
      </div>
    </header>
    <Toast />
    <main class="et-shell__main">
      <div class="et-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
  .et-menu-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    color: var(--et-primary);
  }

  .et-shell__user {
    display: flex;
    align-items: center;
    gap: var(--et-spacing-md);
  }

  .et-user-name {
    font-size: 14px;
    color: var(--et-text);
    font-weight: 500;
    display: none;
  }

  @media (min-width: 768px) {
    .et-user-name {
      display: inline;
    }
  }

  @media (max-width: 768px) {
    .et-menu-toggle {
      display: block;
    }

    .et-shell__nav {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--et-surface);
      border-bottom: 1px solid var(--et-border);
      flex-direction: column;
      gap: 0;
      padding: 8px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .et-shell__nav--open {
      display: flex;
    }

    .et-shell__nav a {
      display: block;
      padding: 10px 16px;
      border-radius: 0;
    }
  }
</style>
