import './styles.scss';

import { createApp } from 'vue';
import App from './app/App.vue';
import router from './app/router/router';
import { VueQueryPlugin } from '@tanstack/vue-query';

const app = createApp(App);

app.use(router);

app.use(VueQueryPlugin);

app.mount('#root');
