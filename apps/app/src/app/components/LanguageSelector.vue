<template>
  <div class="dropdown">
    <label
      tabindex="0"
      class="btn m-1 btn-ghost"
    >
      <svg
        class="text-base-content/70 size-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="2"
          fill="none"
          stroke="currentColor"
          d="M12 21a9 9 0 1 0 0-18m0 18a9 9 0 1 1 0-18m0 18c2.761 0 3.941-5.163 3.941-9S14.761 3 12 3m0 18c-2.761 0-3.941-5.163-3.941-9S9.239 3 12 3M3.5 9h17m-17 6h17"
        ></path>
      </svg>
      <svg
        class="mt-px hidden size-2 fill-current opacity-60 sm:inline-block"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2048 2048"
      >
        <path
          d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"
        ></path>
      </svg>
    </label>
    <ul
      tabindex="0"
      class="dropdown-content menu menu-xs p-2 shadow bg-base-200 rounded-box w-36"
    >
      <li
        v-for="(name, code) in AVAILABLE_LANGUAGES"
        :key="code"
      >
        <a
          :class="{
            'menu-active': selectedLanguage === code,
          }"
          @click="changeLanguage(code)"
        >
          {{ name }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useLanguage } from '../composables/useLanguage';

const { AVAILABLE_LANGUAGES, changeLanguage, selectedLanguage } = useLanguage();
</script>
