<script setup>
import Button from 'primevue/button';
import ColorPicker from 'primevue/colorpicker';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const emit = defineEmits(['submit']);
const toast = useToast();

const typeOptions = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

const form = ref({
  name: '',
  type: 'expense',
  color: '#22c55e',
});

function submit() {
  if (!form.value.name) {
    toast.add({ severity: 'warn', summary: 'Category name required', life: 2000 });
    return;
  }
  emit('submit', { ...form.value });
  toast.add({ severity: 'success', summary: 'Category added', life: 1500 });
  form.value.name = '';
}
</script>

<template>
  <div class="et-card et-gap">
    <div class="p-inputgroup">
      <InputText v-model="form.name" placeholder="Category name" />
      <Dropdown
        v-model="form.type"
        :options="typeOptions"
        option-label="label"
        option-value="value"
      />
      <ColorPicker v-model="form.color" format="hex" />
    </div>
    <div style="display: flex; justify-content: flex-end">
      <Button label="Add" icon="pi pi-plus" @click="submit" />
    </div>
  </div>
</template>
