<template>
  <div>
    <div class="drawer md:drawer-open">
      <input
        id="my-drawer"
        type="checkbox"
        class="drawer-toggle"
      />
      <div class="drawer-content">
        <RouterView />
      </div>
      <div class="drawer-side">
        <label
          for="my-drawer"
          aria-label="close sidebar"
          class="drawer-overlay"
        >
        </label>
        <ul
          class="menu p-4 w-80 min-h-full bg-base-200 text-base-content rounded-box"
        >
          <li
            v-for="(item, index) in menu"
            :key="`sideMenu_${index}`"
          >
            <router-link
              :to="{ name: item.routeName }"
              :class="
                currentRouteName.includes(item.routeName) ? 'menu-active' : ''
              "
            >
              {{ item.name }}
            </router-link>
          </li>
          <li>
            <span @click="logout">{{
              t('components.sidebar.menu.logout')
            }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useAuth } from './composables/useAuth';
import { useLanguage } from './composables/useLanguage';

const route = useRoute();

const { logout } = useAuth();

const { t } = useLanguage();

const currentRouteName = computed(() => route.matched.map((x) => x.name));

type MenuItem = {
  name: ComputedRef<string>;
  routeName?: string;
};

const menu: MenuItem[] = [
  {
    name: computed(() => t('components.sidebar.menu.dashboard')),
    routeName: 'Dashboard',
  },
  {
    name: computed(() => t('components.sidebar.menu.accounts')),
    routeName: 'Accounts',
  },
  {
    name: computed(() => t('components.sidebar.menu.importTransactions')),
    routeName: 'Import',
  },
];
</script>
