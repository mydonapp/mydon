import './styles.css';

import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';
import App from './app/App.vue';
import router from './app/router/router';
import { createI18n } from 'vue-i18n';
import en from './locales/en';
import de from './locales/de';
import fr from './locales/fr';
import it from './locales/it';

const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en',
  locale: 'en',
  availableLocales: ['en', 'de', 'fr', 'it'],
  messages: {
    en,
    de,
    fr,
    it,
  },
});

const app = createApp(App);

app.use(router);
app.use(i18n);
app.use(VueQueryPlugin);

app.mount('#root');
