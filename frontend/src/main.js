import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { createApp } from 'vue';

import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import './assets/main.css';

import App from './App.vue';
import router from './router';

// Deep indigo/violet brand theme
const LumicorePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
  },
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: LumicorePreset,
    options: {
      darkModeSelector: '.dark-mode',
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);

app.mount('#app');
