<template>
  <div class="layout-wrapper flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside
      class="layout-sidebar flex flex-column bg-gray-900"
      style="width: 240px; min-width: 240px"
    >
      <!-- Logo -->
      <div class="p-4 border-bottom-1 border-gray-700">
        <span class="text-white font-bold text-xl">⚡ Lumicore</span>
        <div class="text-xs text-gray-400 mt-1">Tracker</div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto p-2">
        <ul class="list-none p-0 m-0">
          <NavItem to="/" icon="pi-home" label="Dashboard" />
          <NavItem to="/businesses" icon="pi-building" label="Businesses" />
          <NavItem to="/finance" icon="pi-wallet" label="Finance" />
          <NavItem to="/todos" icon="pi-check-square" label="My Tasks" />
          <template v-if="auth.isAdmin">
            <li class="text-xs text-gray-500 px-3 pt-4 pb-1 uppercase tracking-widest">Admin</li>
            <NavItem to="/admin/users" icon="pi-users" label="Users" />
          </template>
        </ul>
      </nav>

      <!-- User section -->
      <div class="p-3 border-top-1 border-gray-700">
        <div class="flex align-items-center gap-2">
          <Avatar :label="userInitial" shape="circle" size="small" class="bg-primary text-white" />
          <div class="flex-1 overflow-hidden">
            <div class="text-white text-sm font-medium truncate">{{ auth.user?.name }}</div>
            <div class="text-gray-400 text-xs capitalize">{{ auth.user?.role }}</div>
          </div>
          <Button
            icon="pi pi-sign-out"
            text
            rounded
            severity="secondary"
            size="small"
            @click="handleLogout"
            v-tooltip.top="'Logout'"
          />
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex flex-column flex-1 overflow-hidden">
      <!-- Topbar -->
      <header
        class="flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom-1 border-gray-200 shadow-1"
      >
        <div class="text-xl font-semibold text-gray-800">{{ pageTitle }}</div>
        <div class="text-sm text-gray-500">{{ today }}</div>
      </header>

      <!-- Page -->
      <main class="flex-1 overflow-y-auto p-4 bg-gray-50">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import NavItem from '@/components/NavItem.vue';
import { useAuthStore } from '@/stores/auth';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const userInitial = computed(() => auth.user?.name?.charAt(0).toUpperCase() || 'U');

const pageTitles = {
  Dashboard: 'Dashboard',
  Businesses: 'Business Prospecting',
  BusinessDetail: 'Business Detail',
  Finance: 'Finance',
  Categories: 'Finance Categories',
  Todos: 'My Tasks',
  Users: 'User Management',
};

const pageTitle = computed(() => pageTitles[route.name] || 'Lumicore Tracker');

const today = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
);

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>
