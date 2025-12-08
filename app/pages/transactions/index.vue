<script setup>
import TransactionFilters from '@/components/transactions/TransactionFilters.vue';
import TransactionForm from '@/components/transactions/TransactionForm.vue';
import TransactionList from '@/components/transactions/TransactionList.vue';
import { useAccountsStore } from '@/stores/accounts';
import { useCategoriesStore } from '@/stores/categories';
import { useTransactionsStore } from '@/stores/transactions';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import { computed } from 'vue';

const txStore = useTransactionsStore();
const catStore = useCategoriesStore();
const accStore = useAccountsStore();

const { filtered, totals, filters } = storeToRefs(txStore);

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

function handleAdd(txn) {
  txStore.addTransaction(txn);
}

function updateFilters(next) {
  txStore.setFilters(next);
}
</script>

<template>
  <div class="et-gap">
    <h1 class="et-page-title">Transactions</h1>

    <Card class="et-card">
      <template #title>Add transaction</template>
      <template #content>
        <TransactionForm
          :categories="catStore.items"
          :accounts="accStore.items"
          @submit="handleAdd"
        />
      </template>
    </Card>

    <TransactionFilters
      :categories="catStore.items"
      v-model="filters"
      @update:modelValue="updateFilters"
    />

    <Card class="et-card">
      <template #title>Transactions</template>
      <template #subtitle>
        Income:
        <strong>{{ totals.income.toLocaleString() }}</strong>
        • Expense:
        <strong>{{ totals.expense.toLocaleString() }}</strong>
        • Net:
        <strong>{{ totals.net.toLocaleString() }}</strong>
      </template>
      <template #content>
        <TransactionList
          :transactions="filtered"
          :categories-by-id="categoriesById"
          :accounts-by-id="accountsById"
          currency-code="LKR"
        />
      </template>
    </Card>
  </div>
</template>
