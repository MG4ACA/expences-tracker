<script setup>
import Button from 'primevue/button'
import Card from 'primevue/card'

const quickLinks = [
  { label: 'Add Transaction', to: '/transactions' },
  { label: 'Manage Categories', to: '/categories' }
]
</script>

<template>
  <div class="et-gap">
    <header>
      <h1 class="et-page-title">Dashboard (MVP shell)</h1>
      <p class="et-muted">Start by adding categories and transactions. More reports coming in Phase 2.</p>
    </header>

    <Card class="et-card">
      <template #title>Quick actions</template>
      <template #content>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <NuxtLink v-for="item in quickLinks" :key="item.to" :to="item.to">
            <Button :label="item.label" icon="pi pi-arrow-right" severity="primary" outlined />
          </NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>
