// https://nuxt.com/docs/api/configuration/nuxt-config
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
    },
  },
});
