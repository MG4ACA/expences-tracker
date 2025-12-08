import { defineStore } from 'pinia';

const seedAccounts = [
  { id: 'acc-cash', name: 'Cash', type: 'cash' },
  { id: 'acc-bank', name: 'Bank', type: 'bank' },
];

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    items: [...seedAccounts],
  }),
  actions: {
    addAccount(payload) {
      const id = `acc-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
      this.items.push({ id, ...payload });
      return id;
    },
  },
});
