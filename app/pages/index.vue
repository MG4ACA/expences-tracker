<script setup>
import { useAccountsStore } from '@/stores/accounts';
import { useCategoriesStore } from '@/stores/categories';
import { useTransactionsStore } from '@/stores/transactions';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';
import { computed } from 'vue';

const quickLinks = [
  { label: 'Add Transaction', to: '/transactions' },
  { label: 'Manage Categories', to: '/categories' },
];

const txStore = useTransactionsStore();
const catStore = useCategoriesStore();
const accStore = useAccountsStore();
const { totals, items } = storeToRefs(txStore);

const categoriesById = computed(() =>
  catStore.items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {})
);
const accountsById = computed(() =>
  accStore.items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {})
);

const recent = computed(() => items.value.slice(0, 5));
</script>

<template>
  <div class="et-gap">
    <header>
      <h1 class="et-page-title">Dashboard</h1>
      <p class="et-muted">Snapshot of your income, expenses, and latest activity.</p>
    </header>

    <div
      style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))"
    >
      <Card class="et-card">
        <template #title>Income</template>
        <template #content>
          <div style="font-size: 24px; font-weight: 700; color: #16a34a">
            {{ formatCurrency(totals.income, 'LKR') }}
          </div>
        </template>
      </Card>
      <Card class="et-card">
        <template #title>Expenses</template>
        <template #content>
          <div style="font-size: 24px; font-weight: 700; color: #dc2626">
            {{ formatCurrency(totals.expense, 'LKR') }}
          </div>
        </template>
      </Card>
      <Card class="et-card">
        <template #title>Net</template>
        <template #content>
          <div style="font-size: 24px; font-weight: 700">
            {{ formatCurrency(totals.net, 'LKR') }}
          </div>
        </template>
      </Card>
    </div>

    <Card class="et-card">
      <template #title>Quick actions</template>
      <template #content>
        <div style="display: flex; gap: 12px; flex-wrap: wrap">
          <NuxtLink v-for="item in quickLinks" :key="item.to" :to="item.to">
            <Button :label="item.label" icon="pi pi-arrow-right" severity="primary" outlined />
          </NuxtLink>
        </div>
      </template>
    </Card>

    <Card class="et-card">
      <template #title>Recent activity</template>
      <template #content>
        <DataTable :value="recent" striped-rows size="small" data-key="id">
          <Column field="occurredAt" header="Date">
            <template #body="{ data }">{{ formatDate(data.occurredAt) }}</template>
          </Column>
          <Column field="type" header="Type">
            <template #body="{ data }">
              <Tag
                :value="data.type === 'expense' ? 'Expense' : 'Income'"
                :severity="data.type === 'expense' ? 'danger' : 'success'"
              />
            </template>
          </Column>
          <Column field="categoryId" header="Category">
            <template #body="{ data }">{{ categoriesById[data.categoryId]?.name || '—' }}</template>
          </Column>
          <Column field="accountId" header="Account">
            <template #body="{ data }">{{ accountsById[data.accountId]?.name || '—' }}</template>
          </Column>
          <Column field="amount" header="Amount">
            <template #body="{ data }">{{ formatCurrency(data.amount, 'LKR') }}</template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>
