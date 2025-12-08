<script setup>
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';

const props = defineProps({
  transactions: { type: Array, required: true },
  categoriesById: { type: Object, required: true },
  accountsById: { type: Object, required: true },
  currencyCode: { type: String, default: 'LKR' },
});
</script>

<template>
  <DataTable :value="transactions" striped-rows size="small" data-key="id" paginator :rows="5">
    <Column field="occurredAt" header="Date" :sortable="true">
      <template #body="{ data }">{{ formatDate(data.occurredAt) }}</template>
    </Column>
    <Column field="type" header="Type" :sortable="true" style="width: 120px">
      <template #body="{ data }">
        <Tag
          :value="data.type === 'expense' ? 'Expense' : 'Income'"
          :severity="data.type === 'expense' ? 'danger' : 'success'"
        />
      </template>
    </Column>
    <Column field="categoryId" header="Category" :sortable="true">
      <template #body="{ data }">{{ categoriesById[data.categoryId]?.name || '—' }}</template>
    </Column>
    <Column field="accountId" header="Account" :sortable="true">
      <template #body="{ data }">{{ accountsById[data.accountId]?.name || '—' }}</template>
    </Column>
    <Column field="amount" header="Amount" :sortable="true" style="width: 150px; text-align: right">
      <template #body="{ data }">
        <span :style="{ color: data.type === 'expense' ? '#dc2626' : '#16a34a', fontWeight: 600 }">
          {{ formatCurrency(data.amount, currencyCode) }}
        </span>
      </template>
    </Column>
    <Column field="note" header="Note" style="max-width: 220px">
      <template #body="{ data }">{{ data.note || '—' }}</template>
    </Column>
  </DataTable>
</template>
