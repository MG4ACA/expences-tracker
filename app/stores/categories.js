import { defineStore } from 'pinia';

const seedCategories = [
  { id: 'cat-groceries', name: 'Groceries', type: 'expense', color: '#22c55e' },
  { id: 'cat-transport', name: 'Transport', type: 'expense', color: '#3b82f6' },
  { id: 'cat-salary', name: 'Salary', type: 'income', color: '#f59e0b' },
];

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    items: [...seedCategories],
  }),
  actions: {
    addCategory(payload) {
      const id = `cat-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
      this.items.push({ id, ...payload });
      return id;
    },
  },
  getters: {
    expenseCategories: (state) => state.items.filter((c) => c.type === 'expense'),
    incomeCategories: (state) => state.items.filter((c) => c.type === 'income'),
  },
});
