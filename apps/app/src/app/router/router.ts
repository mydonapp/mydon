import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../AppLayout.vue'),
      children: [
        {
          path: '/',
          component: () => import('../views/DashboardView.vue'),
          name: 'Dashboard',
        },
        {
          path: '/accounts',
          component: () => import('../views/AccountsView.vue'),
          name: 'Accounts',
        },
        {
          path: '/accounts/:id',
          component: () => import('../views/AccountView.vue'),
          name: 'Account',
        },
        {
          path: '/import',
          component: () => import('../views/ImportTransactionView.vue'),
          name: 'Import',
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'Home' },
      name: 'NotFound',
    },
  ],
});

// let isInitialized = false;

// router.beforeEach(async (to) => {
//   console.log('to', to);
//   const { isAuthenticated, whoami } = useAuth();

//   if (!isInitialized) {
//     try {
//       await whoami();
//     } catch (error) {
//       // stub
//     }
//     isInitialized = true;
//   }

//   if (!isAuthenticated() && !to.meta?.noAuthRequired) {
//     return { name: 'Login', query: { next: to.fullPath } };
//   }
// });

export default router;
