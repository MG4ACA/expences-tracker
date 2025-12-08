<script setup>
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';

const props = defineProps({
  categories: { type: Array, required: true },
  accounts: { type: Array, required: true },
  defaultType: { type: String, default: 'expense' },
});

const emit = defineEmits(['submit']);
const toast = useToast();

const form = ref({
  amount: null,
  type: props.defaultType,
  categoryId: null,
  accountId: props.accounts?.[0]?.id ?? null,
  occurredAt: new Date(),
  note: '',
});

const typeOptions = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

const filteredCategories = computed(() =>
  props.categories.filter((c) => c.type === form.value.type)
);

function submit() {
  if (!form.value.amount || !form.value.categoryId) {
    toast.add({
      severity: 'warn',
      summary: 'Missing data',
      detail: 'Amount and category are required.',
      life: 2500,
    });
    return;
  }
  emit('submit', { ...form.value, amount: Number(form.value.amount) });
  toast.add({ severity: 'success', summary: 'Saved', detail: 'Transaction added.', life: 2000 });
  form.value.note = '';
  form.value.amount = null;
}
</script>

<template>
  <div class="et-gap">
    <div class="p-inputgroup">
      <span class="p-inputgroup-addon">
        <Dropdown
          v-model="form.type"
          :options="typeOptions"
          option-label="label"
          option-value="value"
        />
      </span>
      <InputNumber
        v-model="form.amount"
        input-id="amount"
        placeholder="Amount"
        mode="currency"
        currency="LKR"
        :min-fraction-digits="0"
        :max-fraction-digits="2"
      />
      <Dropdown
        v-model="form.categoryId"
        :options="filteredCategories"
        option-label="name"
        option-value="id"
        placeholder="Category"
        style="min-width: 180px"
      />
    </div>

    <div class="et-form-grid">
      <Calendar v-model="form.occurredAt" show-icon show-button-bar fluid date-format="yy-M-dd" />
      <Dropdown
        v-model="form.accountId"
        :options="accounts"
        option-label="name"
        option-value="id"
        placeholder="Account"
      />
    </div>

    <InputText v-model="form.note" placeholder="Note (optional)" />

    <Divider />
    <div class="et-form-actions">
      <Button label="Add" icon="pi pi-check" @click="submit" />
    </div>
  </div>
</template>

<style scoped>
.et-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.et-form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .et-form-grid {
    grid-template-columns: 1fr;
  }

  .et-form-actions {
    justify-content: stretch;
  }

  .et-form-actions :deep(.p-button) {
    width: 100%;
  }
}
</style>
