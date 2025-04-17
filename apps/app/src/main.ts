import './styles.css';

import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';
import App from './app/App.vue';
import router from './app/router/router';

const app = createApp(App);

app.use(router);

app.use(VueQueryPlugin);

app.mount('#root');
