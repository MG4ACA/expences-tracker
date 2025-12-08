<script setup>
import Tag from 'primevue/tag';

const props = defineProps({
  categories: { type: Array, required: true },
});
</script>

<template>
  <div
    class="et-card"
    style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))"
  >
    <div
      v-for="cat in props.categories"
      :key="cat.id"
      class="et-card"
      style="border-color: #e2e8f0; box-shadow: none"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
        <div style="display: flex; gap: 8px; align-items: center">
          <span
            :style="{ width: '12px', height: '12px', borderRadius: '999px', background: cat.color }"
          ></span>
          <strong>{{ cat.name }}</strong>
        </div>
        <Tag :value="cat.type" :severity="cat.type === 'expense' ? 'danger' : 'success'" />
      </div>
    </div>
    <p v-if="!props.categories.length" class="et-muted" style="grid-column: 1 / -1">
      No categories yet.
    </p>
  </div>
</template>
