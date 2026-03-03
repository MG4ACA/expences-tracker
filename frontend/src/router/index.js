import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'businesses',
        name: 'Businesses',
        component: () => import('@/views/businesses/BusinessListView.vue'),
      },
      {
        path: 'businesses/:id',
        name: 'BusinessDetail',
        component: () => import('@/views/businesses/BusinessDetailView.vue'),
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/finance/FinanceView.vue'),
      },
      {
        path: 'finance/categories',
        name: 'Categories',
        component: () => import('@/views/finance/CategoriesView.vue'),
      },
      {
        path: 'todos',
        name: 'Todos',
        component: () => import('@/views/todos/TodoView.vue'),
      },
      {
        path: 'servers',
        name: 'Servers',
        component: () => import('@/views/servers/ServersView.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'admin/users',
        name: 'Users',
        component: () => import('@/views/admin/UsersView.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'screenshots/upload',
        name: 'ScreenshotUpload',
        component: () => import('@/views/screenshots/ScreenshotUploadView.vue'),
      },
      {
        path: 'screenshots/queue',
        name: 'ScreenshotQueue',
        component: () => import('@/views/screenshots/ScreenshotQueueView.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (!to.meta.public && !auth.isLoggedIn) {
    return { name: 'Login' };
  }

  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'Dashboard' };
  }
});

export default router;
