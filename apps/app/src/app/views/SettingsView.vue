<template>
  <div class="min-h-screen bg-primary">
    <!-- Header Section -->
    <PageHeader
      :title="t('views.settings.title')"
      :subtitle="t('views.settings.subtitle')"
    >
    </PageHeader>

    <div
      class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-none xl:max-w-screen-2xl"
    >
      <div class="space-y-6">
        <!-- User Information Section -->
        <div class="card bg-secondary shadow p-1.5 sm:p-2 rounded-lg">
          <div class="p-4">
            <h2 class="text-xl font-bold mb-6 flex items-center text-white">
              <RiUserLine class="w-6 h-6 mr-2" />
              {{ t('views.settings.sections.profile.title') }}
            </h2>

            <div
              v-if="loading"
              class="space-y-4"
            >
              <div
                class="skeleton h-12 w-full bg-tertiary animate-pulse rounded"
              ></div>
              <div
                class="skeleton h-12 w-full bg-tertiary animate-pulse rounded"
              ></div>
            </div>

            <div
              v-else-if="user"
              class="space-y-6"
            >
              <!-- User Avatar and Basic Info -->
              <div class="flex items-center space-x-6">
                <div
                  class="w-20 h-20 bg-accent text-white rounded-full flex items-center justify-center"
                >
                  <span class="text-2xl font-bold leading-none">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-white">{{ user.name }}</h3>
                  <p class="text-gray-400">{{ user.email }}</p>
                </div>
              </div>

              <!-- User Details Form -->
              <div class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <BaseInput
                      v-model="userName"
                      type="text"
                      :label="t('views.settings.sections.profile.name')"
                      :placeholder="
                        t('views.settings.sections.profile.namePlaceholder')
                      "
                    >
                      <template #leftIcon>
                        <RiUserLine class="w-5 h-5" />
                      </template>
                    </BaseInput>
                  </div>

                  <div>
                    <BaseInput
                      v-model="userEmail"
                      type="email"
                      :label="t('views.settings.sections.profile.email')"
                      :placeholder="
                        t('views.settings.sections.profile.emailPlaceholder')
                      "
                    >
                      <template #leftIcon>
                        <RiMailLine class="w-5 h-5" />
                      </template>
                    </BaseInput>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <BaseButton
                  variant="secondary"
                  :disabled="isUpdating"
                  :loading="isUpdating"
                >
                  {{ t('views.settings.sections.profile.updateButton') }}
                </BaseButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Language Settings Section -->
        <div class="card bg-secondary shadow p-1.5 sm:p-2 rounded-lg">
          <div class="p-4">
            <h2 class="text-xl font-bold mb-6 flex items-center text-white">
              <RiGlobalLine class="w-6 h-6 mr-2" />
              {{ t('views.settings.sections.language.title') }}
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block mb-2">
                  <span class="label font-semibold text-white">
                    {{ t('views.settings.sections.language.currentLanguage') }}
                  </span>
                </label>
                <div class="space-y-3">
                  <div class="relative w-full">
                    <BaseButton
                      variant="secondary"
                      class="w-full justify-between"
                      @click="toggleDropdown"
                    >
                      <div class="flex items-center">
                        <div
                          class="w-8 h-8 mr-3 flex items-center justify-center bg-accent/10 rounded-full"
                        >
                          <span class="text-lg font-semibold text-accent">
                            {{ getLanguageFlag(selectedLanguage) }}
                          </span>
                        </div>
                        <span class="font-medium">{{
                          AVAILABLE_LANGUAGES[selectedLanguage]
                        }}</span>
                      </div>
                      <RiArrowDownLine
                        class="w-5 h-5 transition-transform duration-200"
                        :class="{ 'rotate-180': isDropdownOpen }"
                      />
                    </BaseButton>
                    <div
                      v-if="isDropdownOpen"
                      class="absolute z-10 w-full mt-2 bg-secondary border border-gray-600 rounded-lg shadow-xl p-3"
                    >
                      <div
                        v-for="(name, code) in AVAILABLE_LANGUAGES"
                        :key="code"
                        class="mb-1 last:mb-0"
                      >
                        <BaseButton
                          :variant="
                            selectedLanguage === code ? 'primary' : 'ghost'
                          "
                          class="flex items-center p-3 rounded-lg font-medium w-full text-left"
                          @click="selectLanguage(code)"
                        >
                          <div
                            class="w-10 h-10 mr-4 flex items-center justify-center bg-tertiary rounded-full"
                            :class="{
                              'bg-accent/20': selectedLanguage === code,
                            }"
                          >
                            <span
                              class="text-xl font-bold"
                              :class="{
                                'text-accent': selectedLanguage === code,
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
                          <RiCheckLine
                            v-if="selectedLanguage === code"
                            class="w-5 h-5 ml-2"
                          />
                        </BaseButton>
                      </div>
                    </div>
                  </div>
                  <div class="text-sm text-gray-400 px-1">
                    {{ t('views.settings.sections.language.description') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy Settings Section -->
        <div class="card bg-secondary shadow p-1.5 sm:p-2 rounded-lg">
          <div class="p-4">
            <h2 class="text-xl font-bold mb-6 flex items-center text-white">
              <RiEyeLine class="w-6 h-6 mr-2" />
              {{ t('views.settings.sections.privacy.title') }}
            </h2>

            <div class="space-y-4">
              <div
                class="flex items-center justify-between p-4 bg-primary rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <RiEyeLine class="w-5 h-5 text-gray-400" />
                  <div>
                    <p class="font-medium text-white">
                      {{ t('views.settings.sections.privacy.privacyMode') }}
                    </p>
                    <p class="text-sm text-gray-400">
                      {{
                        t(
                          'views.settings.sections.privacy.privacyModeDescription',
                        )
                      }}
                    </p>
                  </div>
                </div>
                <BaseToggle
                  v-model="isPrivate"
                  size="md"
                  variant="warning"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="card bg-secondary shadow p-1.5 sm:p-2 rounded-lg">
          <div class="p-4">
            <h2 class="text-xl font-bold mb-6 flex items-center text-white">
              <RiInformationLine class="w-6 h-6 mr-2" />
              {{ t('views.settings.sections.about.title') }}
            </h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="font-medium text-white">{{
                  t('views.settings.sections.about.version')
                }}</span>
                <span class="text-gray-400">1.0.0</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="font-medium text-white">{{
                  t('views.settings.sections.about.buildDate')
                }}</span>
                <span class="text-gray-400">{{
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
import {
  RiArrowLeftLine,
  RiUserLine,
  RiGlobalLine,
  RiArrowDownLine,
  RiCheckLine,
  RiEyeLine,
  RiInformationLine,
  RiMailLine,
} from '@remixicon/vue';
import PageHeader from '../components/PageHeader.vue';
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import BaseToggle from '../components/BaseToggle.vue';
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
