import { useStorage } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export const useLanguage = () => {
  const AVAILABLE_LANGUAGES = {
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    it: 'Italiano',
  };

  const { t, locale } = useI18n();

  const state = useStorage(
    'mydon:i18n',
    {
      language: window.navigator.language.substring(0, 2) || 'en',
    },
    localStorage,
    { mergeDefaults: true },
  );

  locale.value = state.value.language;

  const changeLanguage = (langCode: string) => {
    locale.value = langCode;
    state.value.language = langCode;
  };

  return {
    AVAILABLE_LANGUAGES,
    t,
    changeLanguage,
    selectedLanguage: computed(() => state.value.language),
  };
};
