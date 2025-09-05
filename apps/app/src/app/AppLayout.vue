<template>
  <div class="min-h-screen bg-primary">
    <div class="drawer">
      <input
        id="my-drawer"
        type="checkbox"
        class="drawer-toggle"
      />

      <!-- Main Content -->
      <div class="drawer-content flex flex-col">
        <!-- Top Navigation Bar (Mobile/Tablet) -->
        <div
          class="xl:hidden navbar bg-secondary border-b border-primary sticky top-0 z-20"
        >
          <div class="flex items-center space-x-3">
            <BaseButton
              variant="ghost"
              size="sm"
              class="p-2"
              as="label"
              for="my-drawer"
              aria-label="Open menu"
            >
              <RiMenuLine class="w-6 h-6" />
            </BaseButton>
            <h1 class="text-xl font-bold text-primary-400">myDon</h1>
          </div>
        </div>

        <!-- Page Content -->
        <div class="flex-1">
          <RouterView />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="drawer-side">
        <aside
          class="h-full w-80 bg-secondary flex flex-col border-r border-primary overflow-y-auto relative z-40"
        >
          <!-- Logo Section -->
          <div class="p-4 sm:p-6 border-b border-primary">
            <div class="flex items-center space-x-3">
              <div
                class="flex items-center justify-center bg-primary-600 text-white rounded-xl w-12 h-12 flex-shrink-0"
              >
                <span class="text-lg font-bold">D</span>
              </div>
              <div class="min-w-0 flex-1">
                <h1
                  class="text-xl sm:text-2xl font-bold text-primary-400 truncate"
                >
                  myDon
                </h1>
                <p class="text-xs sm:text-sm text-secondary truncate">
                  {{ t('app.subtitle') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Navigation Menu -->
          <nav class="flex-1 p-3 sm:p-4">
            <ul class="space-y-1 sm:space-y-2 w-full">
              <li
                v-for="(item, index) in menu"
                :key="`sideMenu_${index}`"
                class="w-full"
              >
                <router-link
                  :to="{ name: item.routeName }"
                  :class="[
                    'nav-link flex items-center space-x-3 p-2 sm:p-3 text-sm sm:text-base w-full',
                    currentRouteName.includes(item.routeName)
                      ? 'active bg-tertiary text-primary-400'
                      : 'text-secondary',
                  ]"
                >
                  <component
                    :is="item.icon"
                    class="w-5 h-5 flex-shrink-0"
                  />
                  <span class="font-medium truncate">{{ item.name }}</span>
                </router-link>
              </li>
            </ul>
          </nav>

          <!-- User Section -->
          <div class="p-3 sm:p-4 border-t border-primary">
            <div class="space-y-2 sm:space-y-3">
              <!-- Privacy Toggle -->
              <div
                class="flex items-center justify-between p-2 sm:p-3 bg-primary rounded-lg"
              >
                <div class="flex items-center space-x-2 min-w-0 flex-1">
                  <RiEyeLine class="w-4 h-4 text-muted flex-shrink-0" />
                  <span class="text-xs sm:text-sm font-medium truncate">
                    Privacy Mode
                  </span>
                </div>
                <BaseToggle
                  v-model="isPrivate"
                  size="sm"
                  variant="warning"
                />
              </div>

              <!-- User Info -->
              <div
                class="flex items-center space-x-3 p-2 sm:p-3 bg-primary rounded-lg cursor-pointer hover:bg-tertiary transition-colors"
                @click="$router.push({ name: 'Settings' })"
              >
                <div
                  class="flex items-center justify-center bg-secondary text-white rounded-full w-8 sm:w-10 h-8 sm:h-10 flex-shrink-0"
                >
                  <span class="text-xs sm:text-sm font-semibold">
                    {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p
                    class="font-medium text-xs sm:text-sm truncate text-primary"
                  >
                    {{ user?.name || t('app.user') }}
                  </p>
                  <p class="text-xs text-muted truncate">
                    {{ user?.email || t('app.userEmail') }}
                  </p>
                </div>
                <RiSettings3Line class="w-4 h-4 text-muted flex-shrink-0" />
              </div>

              <BaseButton
                variant="secondary"
                class="w-full text-xs sm:text-sm"
                @click="logout"
              >
                <RiLogoutBoxRLine class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span class="truncate">{{
                  t('components.sidebar.menu.logout')
                }}</span>
              </BaseButton>
            </div>
          </div>
        </aside>
      </div>

      <!-- Overlay for mobile/tablet - closes sidebar when clicked -->
      <label
        for="my-drawer"
        aria-label="close sidebar"
        class="drawer-overlay xl:hidden"
      ></label>
    </div>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import {
  RiMenuLine,
  RiEyeLine,
  RiSettings3Line,
  RiLogoutBoxRLine,
  RiDashboardLine,
  RiWallet3Line,
  RiFileTextLine,
  RiBarChartBoxLine,
} from '@remixicon/vue';
import ToastContainer from './components/ToastContainer.vue';
import BaseButton from './components/BaseButton.vue';
import BaseToggle from './components/BaseToggle.vue';
import { useAuth } from './composables/useAuth';
import { useLanguage } from './composables/useLanguage';
import { usePrivacy } from './composables/usePrivacy';
import { useUser } from './composables/useUser';

const route = useRoute();

const { logout } = useAuth();
const { t } = useLanguage();
const { isPrivate } = usePrivacy();
const { user } = useUser();

const currentRouteName = computed(() => route.matched.map((x) => x.name));

type MenuItem = {
  name: ComputedRef<string>;
  routeName?: string;
  icon: any;
};

const menu: MenuItem[] = [
  {
    name: computed(() => t('components.sidebar.menu.dashboard')),
    routeName: 'Dashboard',
    icon: RiDashboardLine,
  },
  {
    name: computed(() => t('components.sidebar.menu.accounts')),
    routeName: 'Accounts',
    icon: RiWallet3Line,
  },
  // {
  //   name: computed(() => t('components.sidebar.menu.spendingAnalysis')),
  //   routeName: 'SpendingAnalysis',
  //   icon: RiBarChartBoxLine,
  // },
  {
    name: computed(() => t('components.sidebar.menu.importTransactions')),
    routeName: 'Import',
    icon: RiFileTextLine,
  },
  {
    name: computed(() => t('components.sidebar.menu.settings')),
    routeName: 'Settings',
    icon: RiSettings3Line,
  },
];
</script>

<style scoped>
.drawer-side aside {
  position: fixed;
  height: 100vh;
}

@media (min-width: 1024px) {
  .drawer-side aside {
    position: sticky;
    top: 0;
  }
}
</style>
