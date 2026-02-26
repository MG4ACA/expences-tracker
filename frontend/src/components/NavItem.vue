<template>
  <li>
    <RouterLink :to="to" custom v-slot="{ isActive, navigate }">
      <a
        @click="navigate"
        class="nav-link"
        :class="{ 'nav-link--active': isActive }"
      >
        <i :class="`pi ${icon}`" class="nav-icon"></i>
        <span class="nav-label">{{ label }}</span>
      </a>
    </RouterLink>
  </li>
</template>

<script setup>
defineProps({ to: String, icon: String, label: String });
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.875rem;
  font-weight: 450;
  transition: background 0.15s ease, color 0.15s ease;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
}

.nav-link--active {
  background: rgba(99, 102, 241, 0.2);
  color: #fff;
  font-weight: 500;
}

.nav-link--active .nav-icon {
  color: var(--p-primary-400, #818cf8);
}

.nav-icon {
  font-size: 0.9rem;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}
</style>

