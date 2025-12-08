<script setup>
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';

const props = defineProps({
  categories: { type: Array, required: true },
  modelValue: {
    type: Object,
    default: () => ({ type: 'all', categoryId: 'all', from: null, to: null }),
  },
});

const emit = defineEmits(['update:modelValue', 'reset']);

const typeOptions = [
  { label: 'All', value: 'all' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Incomes', value: 'income' },
];

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function reset() {
  emit('update:modelValue', { type: 'all', categoryId: 'all', from: null, to: null });
  emit('reset');
}
</script>

<template>
  <div
    class="et-card"
    style="
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      align-items: center;
    "
  >
    <Dropdown
      v-model="props.modelValue.type"
      :options="typeOptions"
      option-label="label"
      option-value="value"
      @update:model-value="(v) => update('type', v)"
    />
    <Dropdown
      v-model="props.modelValue.categoryId"
      :options="[
        { label: 'All categories', value: 'all' },
        ...props.categories.map((c) => ({ label: c.name, value: c.id })),
      ]"
      option-label="label"
      option-value="value"
      @update:model-value="(v) => update('categoryId', v)"
    />
    <Calendar
      v-model="props.modelValue.from"
      show-icon
      placeholder="From"
      fluid
      @update:model-value="(v) => update('from', v)"
    />
    <Calendar
      v-model="props.modelValue.to"
      show-icon
      placeholder="To"
      fluid
      @update:model-value="(v) => update('to', v)"
    />
    <Button label="Reset" icon="pi pi-refresh" outlined size="small" @click="reset" />
  </div>
</template>
