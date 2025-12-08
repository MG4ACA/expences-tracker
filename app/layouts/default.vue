<script setup>
import { ref } from 'vue';

const isMobileMenuOpen = ref(false);

const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
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
      </nav>
    </header>
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
