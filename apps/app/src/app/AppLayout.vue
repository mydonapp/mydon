<template>
  <div>
    <div class="drawer md:drawer-open">
      <input id="my-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content">
        <RouterView />
      </div>
      <div class="drawer-side">
        <label
          for="my-drawer"
          aria-label="close sidebar"
          class="drawer-overlay"
        ></label>
        <ul
          class="menu p-4 w-80 min-h-full bg-base-200 text-base-content rounded-box"
        >
          <li v-for="(item, index) in menu" :key="`sideMenu_${index}`">
            <router-link
              :to="{ name: item.routeName }"
              :class="currentRouteName.includes(item.routeName) ? 'active' : ''"
              >{{ item.name }}</router-link
            >
          </li>
          <li>
            <span @click="logout">Logout</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useAuth } from './composables/useAuth';

const route = useRoute();

const { logout } = useAuth();

const currentRouteName = computed(() => route.matched.map((x) => x.name));

type MenuItem = {
  name: string;
  routeName?: string;
};

const menu: MenuItem[] = [
  {
    name: 'Dashboard',
    routeName: 'Dashboard',
  },
  {
    name: 'Accounts',
    routeName: 'Accounts',
  },
  {
    name: 'Import Transactions',
    routeName: 'Import',
  },
];
</script>
