import { isWithinRange } from '@/utils/date';
import { defineStore } from 'pinia';

const now = new Date();
const seedTransactions = [
  {
    id: 'txn-1',
    type: 'expense',
    categoryId: 'cat-groceries',
    accountId: 'acc-cash',
    amount: 4500,
    note: 'Weekly groceries',
    occurredAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'txn-2',
    type: 'income',
    categoryId: 'cat-salary',
    accountId: 'acc-bank',
    amount: 120000,
    note: 'Salary',
    occurredAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    items: [...seedTransactions],
    filters: {
      type: 'all',
      categoryId: 'all',
      from: null,
      to: null,
    },
  }),
  actions: {
    addTransaction(payload) {
      const id = `txn-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
      const occurredAt = payload.occurredAt || new Date().toISOString();
      const base = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.items.unshift({ id, ...base, ...payload, occurredAt });
      return id;
    },
    setFilters(next) {
      this.filters = { ...this.filters, ...next };
    },
  },
  getters: {
    filtered: (state) => {
      return state.items.filter((item) => {
        const matchType = state.filters.type === 'all' || item.type === state.filters.type;
        const matchCat =
          state.filters.categoryId === 'all' || item.categoryId === state.filters.categoryId;
        const matchDate = isWithinRange(item.occurredAt, state.filters.from, state.filters.to);
        return matchType && matchCat && matchDate;
      });
    },
    totals: (state) => {
      const sums = state.items.reduce(
        (acc, item) => {
          if (item.type === 'expense') acc.expense += Number(item.amount) || 0;
          if (item.type === 'income') acc.income += Number(item.amount) || 0;
          return acc;
        },
        { income: 0, expense: 0 }
      );
      return { ...sums, net: sums.income - sums.expense };
    },
  },
});
