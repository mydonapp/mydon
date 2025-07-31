<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header Section -->
    <div
      class="bg-gradient-to-r from-primary to-secondary text-primary-content"
    >
      <div class="container mx-auto px-6 py-8">
        <div class="flex items-center gap-4">
          <button
            class="btn btn-circle btn-ghost btn-sm"
            @click="$router.back()"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"
              />
            </svg>
          </button>
          <div>
            <h1 class="text-3xl font-bold">{{ t('views.settings.title') }}</h1>
            <p class="text-primary-content/80 mt-1">
              {{ t('views.settings.subtitle') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-6 py-8">
      <div class="max-w-4xl mx-auto space-y-8">
        <!-- User Information Section -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-xl mb-6 flex items-center">
              <svg
                class="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
                />
              </svg>
              {{ t('views.settings.sections.profile.title') }}
            </h2>

            <div
              v-if="loading"
              class="space-y-4"
            >
              <div class="skeleton h-12 w-full"></div>
              <div class="skeleton h-12 w-full"></div>
            </div>

            <div
              v-else-if="user"
              class="space-y-6"
            >
              <!-- User Avatar and Basic Info -->
              <div class="flex items-center space-x-6">
                <div class="avatar">
                  <div
                    class="bg-primary text-primary-content rounded-full w-20 flex items-center justify-center"
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    "
                  >
                    <span class="text-2xl font-bold leading-none">
                      {{ user.name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 class="text-2xl font-bold">{{ user.name }}</h3>
                  <p class="text-base-content/60">{{ user.email }}</p>
                </div>
              </div>

              <!-- User Details Form -->
              <div class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div class="form-control">
                    <label class="block mb-2">
                      <span class="label-text font-semibold">
                        {{ t('views.settings.sections.profile.name') }}
                      </span>
                    </label>
                    <input
                      v-model="userName"
                      type="text"
                      class="input input-bordered"
                      :placeholder="
                        t('views.settings.sections.profile.namePlaceholder')
                      "
                    />
                  </div>

                  <div class="form-control">
                    <label class="block mb-2">
                      <span class="label-text font-semibold">
                        {{ t('views.settings.sections.profile.email') }}
                      </span>
                    </label>
                    <input
                      v-model="userEmail"
                      type="email"
                      class="input input-bordered"
                      :placeholder="
                        t('views.settings.sections.profile.emailPlaceholder')
                      "
                    />
                  </div>
                </div>
              </div>

              <div class="card-actions justify-end">
                <button
                  class="btn btn-primary"
                  :disabled="isUpdating"
                >
                  <span
                    v-if="isUpdating"
                    class="loading loading-spinner loading-sm"
                  ></span>
                  {{ t('views.settings.sections.profile.updateButton') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Language Settings Section -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-xl mb-6 flex items-center">
              <svg
                class="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12.87,15.07L10.33,12.56L10.36,12.53C12.1,10.59 13.34,8.36 14.07,6H17V4H10V2H8V4H1V6H12.17C11.5,7.92 10.44,9.75 9,11.35C8.07,10.32 7.3,9.19 6.69,8H4.69C5.42,9.63 6.42,11.17 7.67,12.56L2.58,17.58L4,19L9,14L12.11,17.11L12.87,15.07M18.5,10H16.5L12,22H14L15.12,19H19.87L21,22H23L18.5,10M15.88,17L17.5,12.67L19.12,17H15.88Z"
                />
              </svg>
              {{ t('views.settings.sections.language.title') }}
            </h2>

            <div class="space-y-4">
              <div class="form-control">
                <label class="block mb-2">
                  <span class="label-text font-semibold">
                    {{ t('views.settings.sections.language.currentLanguage') }}
                  </span>
                </label>
                <div class="space-y-3">
                  <div
                    class="dropdown dropdown-end w-full"
                    :class="{ 'dropdown-open': isDropdownOpen }"
                  >
                    <label
                      tabindex="0"
                      class="btn btn-outline btn-lg w-full justify-between hover:btn-primary transition-all duration-200"
                      @click="toggleDropdown"
                    >
                      <div class="flex items-center">
                        <div
                          class="w-8 h-8 mr-3 flex items-center justify-center bg-primary/10 rounded-full"
                        >
                          <span class="text-lg font-semibold text-primary">
                            {{ getLanguageFlag(selectedLanguage) }}
                          </span>
                        </div>
                        <span class="font-medium">{{
                          AVAILABLE_LANGUAGES[selectedLanguage]
                        }}</span>
                      </div>
                      <svg
                        class="w-5 h-5 transition-transform duration-200"
                        :class="{ 'rotate-180': isDropdownOpen }"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                        />
                      </svg>
                    </label>
                    <ul
                      tabindex="0"
                      class="dropdown-content menu p-3 shadow-xl bg-base-100 rounded-xl w-full border border-base-300 mt-2"
                    >
                      <li
                        v-for="(name, code) in AVAILABLE_LANGUAGES"
                        :key="code"
                        class="mb-1 last:mb-0"
                      >
                        <a
                          :class="{
                            'bg-primary text-primary-content':
                              selectedLanguage === code,
                            'hover:bg-base-200': selectedLanguage !== code,
                          }"
                          class="flex items-center p-3 rounded-lg transition-all duration-200 font-medium"
                          @click="selectLanguage(code)"
                        >
                          <div
                            class="w-10 h-10 mr-4 flex items-center justify-center bg-base-200 rounded-full"
                            :class="{
                              'bg-primary/20': selectedLanguage === code,
                            }"
                          >
                            <span
                              class="text-xl font-bold"
                              :class="{
                                'text-primary': selectedLanguage === code,
                              }"
                            >
                              {{ getLanguageFlag(code) }}
                            </span>
                          </div>
                          <div class="flex-1">
                            <div class="font-semibold">{{ name }}</div>
                            <div class="text-sm opacity-60">
                              {{ getLanguageNativeName(code) }}
                            </div>
                          </div>
                          <svg
                            v-if="selectedLanguage === code"
                            class="w-5 h-5 ml-2"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"
                            />
                          </svg>
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div class="text-sm text-base-content/60 px-1">
                    {{ t('views.settings.sections.language.description') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy Settings Section -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-xl mb-6 flex items-center">
              <svg
                class="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                />
              </svg>
              {{ t('views.settings.sections.privacy.title') }}
            </h2>

            <div class="space-y-4">
              <div
                class="flex items-center justify-between p-4 bg-base-100 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <svg
                    class="w-5 h-5 text-base-content/60"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                    />
                  </svg>
                  <div>
                    <p class="font-medium">
                      {{ t('views.settings.sections.privacy.privacyMode') }}
                    </p>
                    <p class="text-sm text-base-content/60">
                      {{
                        t(
                          'views.settings.sections.privacy.privacyModeDescription',
                        )
                      }}
                    </p>
                  </div>
                </div>
                <label class="swap">
                  <input
                    v-model="isPrivate"
                    type="checkbox"
                  />
                  <svg
                    class="w-6 h-6 swap-off text-base-content/40"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                    />
                  </svg>
                  <svg
                    class="w-6 h-6 swap-on text-warning"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z"
                    />
                  </svg>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-xl mb-6 flex items-center">
              <svg
                class="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"
                />
              </svg>
              {{ t('views.settings.sections.about.title') }}
            </h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{
                  t('views.settings.sections.about.version')
                }}</span>
                <span class="text-base-content/60">1.0.0</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{
                  t('views.settings.sections.about.buildDate')
                }}</span>
                <span class="text-base-content/60">{{
                  new Date().toLocaleDateString()
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useUser } from '../composables/useUser';
import { useLanguage } from '../composables/useLanguage';
import { usePrivacy } from '../composables/usePrivacy';

const { user, loading } = useUser();
const { AVAILABLE_LANGUAGES, changeLanguage, selectedLanguage, t } =
  useLanguage();
const { isPrivate } = usePrivacy();

// Form state
const userName = ref('');
const userEmail = ref('');
const isUpdating = ref(false);

// Dropdown state
const isDropdownOpen = ref(false);

// Language flag mapping
const getLanguageFlag = (code: string): string => {
  const flagMap: Record<string, string> = {
    en: '🇺🇸',
    de: '🇩🇪',
    fr: '🇫🇷',
    it: '🇮🇹',
  };
  return flagMap[code] || '🌐';
};

// Native language names
const getLanguageNativeName = (code: string): string => {
  const nativeNames: Record<string, string> = {
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    it: 'Italiano',
  };
  return nativeNames[code] || code.toUpperCase();
};

// Dropdown functions
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const selectLanguage = (code: string) => {
  changeLanguage(code);
  isDropdownOpen.value = false; // Close dropdown after selection
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const dropdown = document.querySelector('.dropdown');
  if (dropdown && !dropdown.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

// Close dropdown when pressing Escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDropdownOpen.value) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
});

// Watch for user data changes to populate form
watch(
  user,
  (newUser) => {
    if (newUser) {
      userName.value = newUser.name;
      userEmail.value = newUser.email;
    }
  },
  { immediate: true },
);
</script>
