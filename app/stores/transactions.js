import { isWithinRange } from '@/utils/date';
import { defineStore } from 'pinia';

const seedTransactions = [];

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    items: [...seedTransactions],
    filters: {
      type: 'all',
      categoryId: 'all',
      from: null,
      to: null,
    },
    isLoading: false,
    error: null,
  }),
  actions: {
    async loadTransactions() {
      const { useAuth } = await import('@/composables/useAuth');
      const { useSupabaseData } = await import('@/composables/useSupabaseData');

      const auth = useAuth();
      const data = useSupabaseData();

      if (!auth.userId.value) return;

      this.isLoading = true;
      this.error = null;
      try {
        const transactions = await data.listTransactions(auth.userId.value);
        this.items = transactions.map((t) => ({
          id: t.id,
          type: t.type.toLowerCase(),
          categoryId: t.category_id,
          accountId: t.account_id,
          amount: t.amount,
          note: t.description || t.notes,
          occurredAt: t.transaction_date,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
      } catch (err) {
        console.error('Failed to load transactions:', err);
        this.error = err.message;
        this.items = [...seedTransactions];
      } finally {
        this.isLoading = false;
      }
    },
    async addTransaction(payload) {
      const { useAuth } = await import('@/composables/useAuth');
      const { useSupabaseData } = await import('@/composables/useSupabaseData');

      const auth = useAuth();
      const data = useSupabaseData();

      if (!auth.userId.value) return null;

      try {
        const newTxn = await data.createTransaction({
          user_id: auth.userId.value,
          account_id: payload.accountId,
          category_id: payload.categoryId,
          amount: payload.amount,
          type: payload.type.toUpperCase(),
          description: payload.note,
          notes: payload.note,
          transaction_date: payload.occurredAt || new Date().toISOString(),
        });

        if (newTxn && newTxn.length > 0) {
          const t = newTxn[0];
          const item = {
            id: t.id,
            type: t.type.toLowerCase(),
            categoryId: t.category_id,
            accountId: t.account_id,
            amount: t.amount,
            note: t.description,
            occurredAt: t.transaction_date,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          };
          this.items.unshift(item);
          return t.id;
        }
      } catch (err) {
        console.error('Failed to add transaction:', err);
        this.error = err.message;
        // Fallback: add to local state
        const id = `txn-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
        const occurredAt = payload.occurredAt || new Date().toISOString();
        const base = {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.items.unshift({ id, ...base, ...payload, occurredAt });
        return id;
      }
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
        { income: 0, expense: 0 },
      );
      return { ...sums, net: sums.income - sums.expense };
    },
  },
});
