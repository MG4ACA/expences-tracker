// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@primevue/nuxt-module'],
  css: ['primeicons/primeicons.css', '@/assets/styles/tokens.css', '@/assets/styles/main.css'],
  build: {
    transpile: ['primevue'],
  },
  runtimeConfig: {
    public: {
      currencyCode: 'LKR',
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://nqiwjaeblkwkaljmxfut.supabase.co',
      supabaseKey:
        process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_c5hhf3Bq__tDT0wGXU4UKQ_pm3bhMBJ',
    },
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },
});
