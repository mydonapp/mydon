<template>
  <div class="min-h-screen bg-base-100">
    <div class="drawer lg:drawer-open">
      <input
        id="my-drawer"
        type="checkbox"
        class="drawer-toggle"
      />

      <!-- Main Content -->
      <div class="drawer-content flex flex-col">
        <!-- Top Navigation Bar (Mobile) -->
        <div class="navbar lg:hidden bg-base-200 border-b border-base-300">
          <div class="flex-none">
            <label
              for="my-drawer"
              class="btn btn-square btn-ghost"
              aria-label="Open menu"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <div class="avatar placeholder flex-shrink-0">
                <div class="bg-primary text-primary-content rounded-full w-8">
                  <span class="text-sm font-bold">D</span>
                </div>
              </div>
              <h1 class="text-xl font-bold text-primary truncate">myDon</h1>
            </div>
          </div>
        </div>

        <!-- Page Content -->
        <div class="flex-1">
          <RouterView />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="drawer-side">
        <label
          for="my-drawer"
          aria-label="close sidebar"
          class="drawer-overlay lg:hidden"
        ></label>

        <aside
          class="min-h-full w-80 bg-base-200 flex flex-col border-r border-base-300"
        >
          <!-- Logo Section -->
          <div class="p-4 sm:p-6 border-b border-base-300">
            <div class="flex items-center space-x-3">
              <div class="avatar placeholder flex-shrink-0">
                <div class="bg-primary text-primary-content rounded-xl w-12">
                  <span class="text-lg font-bold">D</span>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <h1 class="text-xl sm:text-2xl font-bold text-primary truncate">
                  myDon
                </h1>
                <p class="text-xs sm:text-sm text-base-content/60 truncate">
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
                    'flex items-center space-x-3 p-2 sm:p-3 rounded-lg transition-all hover:bg-base-300 text-sm sm:text-base w-full',
                    currentRouteName.includes(item.routeName)
                      ? 'bg-primary text-primary-content hover:bg-primary/90'
                      : 'text-base-content',
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
          <div class="p-3 sm:p-4 border-t border-base-300">
            <div class="space-y-2 sm:space-y-3">
              <!-- Privacy Toggle -->
              <div
                class="flex items-center justify-between p-2 sm:p-3 bg-base-100 rounded-lg"
              >
                <div class="flex items-center space-x-2 min-w-0 flex-1">
                  <svg
                    class="w-4 h-4 text-base-content/60 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                    />
                  </svg>
                  <span class="text-xs sm:text-sm font-medium truncate"
                    >Privacy Mode</span
                  >
                </div>
                <label class="swap flex-shrink-0">
                  <input
                    v-model="isPrivate"
                    type="checkbox"
                  />
                  <svg
                    class="w-4 h-4 swap-off text-base-content/40"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                    />
                  </svg>
                  <svg
                    class="w-4 h-4 swap-on text-warning"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z"
                    />
                  </svg>
                </label>
              </div>

              <!-- User Info -->
              <div
                class="flex items-center space-x-3 p-2 sm:p-3 bg-base-100 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
                @click="$router.push({ name: 'Settings' })"
              >
                <div class="avatar flex-shrink-0">
                  <div
                    class="bg-secondary text-secondary-content rounded-full w-8 sm:w-10 flex items-center justify-center"
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    "
                  >
                    <span class="text-xs sm:text-sm font-semibold leading-none">
                      {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                    </span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-xs sm:text-sm truncate">
                    {{ user?.name || t('app.user') }}
                  </p>
                  <p class="text-xs text-base-content/60 truncate">
                    {{ user?.email || t('app.userEmail') }}
                  </p>
                </div>
                <svg
                  class="w-4 h-4 text-base-content/40 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                  />
                </svg>
              </div>

              <button
                class="btn btn-outline btn-xs sm:btn-sm w-full text-xs sm:text-sm"
                @click="logout"
              >
                <svg
                  class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span class="truncate">{{
                  t('components.sidebar.menu.logout')
                }}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef, h } from 'vue';
import { RouterView, useRoute } from 'vue-router';
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

// Icon components as functions
const DashboardIcon = () =>
  h(
    'svg',
    {
      fill: 'currentColor',
      viewBox: '0 0 24 24',
      class: 'w-5 h-5',
    },
    [
      h('path', {
        d: 'M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z',
      }),
    ],
  );

const AccountsIcon = () =>
  h(
    'svg',
    {
      fill: 'currentColor',
      viewBox: '0 0 24 24',
      class: 'w-5 h-5',
    },
    [
      h('path', {
        d: 'M19,7H5A2,2 0 0,0 3,9V17A2,2 0 0,0 5,19H19A2,2 0 0,0 21,17V9A2,2 0 0,0 19,7M19,17H5V9H19V17Z',
      }),
    ],
  );

const ImportIcon = () =>
  h(
    'svg',
    {
      fill: 'currentColor',
      viewBox: '0 0 24 24',
      class: 'w-5 h-5',
    },
    [
      h('path', {
        d: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z',
      }),
    ],
  );

const SettingsIcon = () =>
  h(
    'svg',
    {
      fill: 'currentColor',
      viewBox: '0 0 24 24',
      class: 'w-5 h-5',
    },
    [
      h('path', {
        d: 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
      }),
    ],
  );

type MenuItem = {
  name: ComputedRef<string>;
  routeName?: string;
  icon: any;
};

const menu: MenuItem[] = [
  {
    name: computed(() => t('components.sidebar.menu.dashboard')),
    routeName: 'Dashboard',
    icon: DashboardIcon,
  },
  {
    name: computed(() => t('components.sidebar.menu.accounts')),
    routeName: 'Accounts',
    icon: AccountsIcon,
  },
  {
    name: computed(() => t('components.sidebar.menu.importTransactions')),
    routeName: 'Import',
    icon: ImportIcon,
  },
  {
    name: computed(() => t('components.sidebar.menu.settings')),
    routeName: 'Settings',
    icon: SettingsIcon,
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
