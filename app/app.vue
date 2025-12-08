<script setup>
import Toast from 'primevue/toast';
</script>

<template>
  <NuxtRouteAnnouncer />
  <Toast position="top-right" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
