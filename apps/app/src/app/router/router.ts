import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'Login' },
    },
    {
      path: '/auth/login',
      name: 'Login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: {
        noAuthRequired: true,
      },
    },
    {
      path: '/auth/signup',
      name: 'SignUp',
      component: () => import('../views/auth/SignupView.vue'),
      meta: {
        noAuthRequired: true,
      },
    },
    {
      path: '/app',
      component: () => import('../AppLayout.vue'),
      children: [
        {
          path: '',
          component: () => import('../views/DashboardView.vue'),
          name: 'Dashboard',
        },
        {
          path: 'accounts',
          component: () => import('../views/AccountsView.vue'),
          name: 'Accounts',
        },
        {
          path: 'accounts/:id',
          component: () => import('../views/AccountView.vue'),
          name: 'Account',
        },
        {
          path: 'import',
          component: () => import('../views/ImportTransactionView.vue'),
          name: 'Import',
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'Login' },
      name: 'NotFound',
    },
  ],
});

let isInitialized = false;

router.beforeEach(async (to) => {
  const { isAuthenticated, init } = useAuth();

  if (!isInitialized) {
    try {
      await init();
    } catch (error) {
      // stub
      console.log(error);
    }
    isInitialized = true;
  }

  if (!isAuthenticated() && !to.meta?.noAuthRequired) {
    return { name: 'Login', query: { next: to.fullPath } };
  }
});

export default router;
