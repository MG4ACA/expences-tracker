<template>
  <div class="layout-wrapper">
    <!-- ── Desktop Sidebar ──────────────────────────────────────── -->
    <aside class="layout-sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <img src="@/assets/logo.png" alt="Lumicore Tracker" class="sidebar-logo-img" />
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <ul class="list-none p-0 m-0">
          <NavItem to="/" icon="pi-home" label="Dashboard" />
          <NavItem to="/businesses" icon="pi-building" label="Businesses" />
          <NavItem to="/screenshots/upload" icon="pi-camera" label="Import Screenshots" />
          <NavItem to="/finance" icon="pi-wallet" label="Finance" />
          <NavItem to="/todos" icon="pi-check-square" label="My Tasks" />
          <NavItem to="/coldcalls" icon="pi-phone" label="Call Logs" />
          <template v-if="auth.isAdmin">
            <li class="nav-section-label">Admin</li>
            <NavItem to="/servers" icon="pi-server" label="Servers" />
            <NavItem to="/admin/users" icon="pi-users" label="Users" />
          </template>
        </ul>
      </nav>

      <!-- User -->
      <div class="sidebar-user">
        <Avatar
          :label="userInitial"
          shape="circle"
          size="small"
          class="sidebar-avatar flex-shrink-0"
        />
        <div class="flex-1 sidebar-user-info">
          <div class="sidebar-user-name">{{ auth.user?.name }}</div>
          <div class="sidebar-user-role">{{ auth.user?.role }}</div>
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
    </aside>

    <!-- ── Main area ─────────────────────────────────────────────── -->
    <div class="layout-main">
      <!-- Topbar -->
      <header class="layout-topbar">
        <div class="topbar-title">{{ pageTitle }}</div>
        <div class="topbar-right">
          <div class="topbar-date">{{ today }}</div>
          <!-- Mobile: show avatar + logout -->
          <div class="topbar-mobile-actions">
            <Avatar :label="userInitial" shape="circle" size="small" class="mobile-avatar" />
            <Button
              icon="pi pi-sign-out"
              text
              rounded
              severity="secondary"
              size="small"
              @click="handleLogout"
            />
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="layout-content">
        <RouterView />
      </main>
    </div>

    <!-- ── Bottom Nav (mobile only) ─────────────────────────────── -->
    <nav class="bottom-nav">
      <RouterLink to="/" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-home"></i>
          <span>Home</span>
        </button>
      </RouterLink>

      <RouterLink to="/businesses" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-building"></i>
          <span>Businesses</span>
        </button>
      </RouterLink>

      <RouterLink to="/screenshots/upload" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-camera"></i>
          <span>Import</span>
        </button>
      </RouterLink>

      <RouterLink to="/finance" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-wallet"></i>
          <span>Finance</span>
        </button>
      </RouterLink>

      <RouterLink to="/todos" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-check-square"></i>
          <span>Tasks</span>
        </button>
      </RouterLink>

      <RouterLink to="/coldcalls" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-phone"></i>
          <span>Calls</span>
        </button>
      </RouterLink>

      <RouterLink v-if="auth.isAdmin" to="/servers" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-server"></i>
          <span>Servers</span>
        </button>
      </RouterLink>
      <RouterLink v-if="auth.isAdmin" to="/admin/users" custom v-slot="{ isActive, navigate }">
        <button class="bottom-nav-item" :class="{ active: isActive }" @click="navigate">
          <i class="pi pi-users"></i>
          <span>Users</span>
        </button>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import NavItem from '@/components/NavItem.vue';
import { useAuthStore } from '@/stores/auth';
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
  Servers: 'Server Deployments',
  Users: 'User Management',
  ScreenshotUpload: 'Import from Screenshots',
  ScreenshotQueue: 'Screenshot Review Queue',
  ColdCalls: 'Cold Call Logs',
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

<style scoped>
/* ── Layout shell ────────────────────────────────────────────── */
.layout-wrapper {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #f4f5fb;
}

/* ── Sidebar ─────────────────────────────────────────────────── */
.layout-sidebar {
  width: 240px;
  min-width: 240px;
  background: #1a1740;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-logo {
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo-img {
  max-width: 100%;
  height: auto;
  max-height: 50px;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.nav-section-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.3);
  padding: 1rem 0.75rem 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.sidebar-user-info {
  overflow: hidden;
}

.sidebar-user-name {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-role {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.7rem;
  text-transform: capitalize;
}

:deep(.sidebar-avatar) {
  background: var(--p-primary-500) !important;
  color: #fff !important;
}

/* ── Main ────────────────────────────────────────────────────── */
.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── Topbar ──────────────────────────────────────────────────── */
.layout-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e8eaf2;
  box-shadow: 0 1px 3px rgba(26, 23, 64, 0.06);
  flex-shrink: 0;
}

.topbar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1740;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topbar-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.topbar-mobile-actions {
  display: none;
}

/* ── Content ─────────────────────────────────────────────────── */
.layout-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  background: #f4f5fb;
  -webkit-overflow-scrolling: touch;
}

/* ── Bottom Nav (hidden on desktop) ─────────────────────────── */
.bottom-nav {
  display: none;
}

/* ── Mobile ──────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .layout-wrapper {
    flex-direction: column;
  }

  .layout-sidebar {
    display: none;
  }

  .layout-topbar {
    padding: 0.75rem 1rem;
  }

  .topbar-date {
    display: none;
  }

  .topbar-mobile-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  :deep(.mobile-avatar) {
    background: var(--p-primary-500) !important;
    color: #fff !important;
    width: 2rem !important;
    height: 2rem !important;
    font-size: 0.8rem !important;
  }

  .layout-content {
    padding: 0.875rem;
    padding-bottom: calc(0.875rem + env(safe-area-inset-bottom, 0px));
  }

  /* ── Bottom Navigation ───────────────────────────────── */
  .bottom-nav {
    display: flex;
    background: #fff;
    border-top: 1px solid #e8eaf2;
    box-shadow: 0 -2px 16px rgba(26, 23, 64, 0.08);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    flex-shrink: 0;
    z-index: 100;
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0.625rem 0.25rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    font-size: 0.65rem;
    font-family: inherit;
    font-weight: 500;
    letter-spacing: 0.01em;
    transition: color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
    min-height: 56px;
  }

  .bottom-nav-item i {
    font-size: 1.25rem;
    transition: transform 0.15s ease;
  }

  .bottom-nav-item.active {
    color: var(--p-primary-500);
  }

  .bottom-nav-item.active i {
    transform: scale(1.1);
  }
}
</style>
