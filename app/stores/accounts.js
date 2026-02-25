import { defineStore } from 'pinia';

const seedAccounts = [];

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    items: [...seedAccounts],
    isLoading: false,
    error: null,
  }),
  actions: {
    async loadAccounts() {
      const { useAuth } = await import('@/composables/useAuth');
      const { useSupabaseData } = await import('@/composables/useSupabaseData');

      const auth = useAuth();
      const data = useSupabaseData();

      if (!auth.userId.value) return;

      this.isLoading = true;
      this.error = null;
      try {
        const accounts = await data.listAccounts(auth.userId.value);
        this.items = accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type.toLowerCase(),
          balance: a.balance,
          currency: a.currency,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        }));
      } catch (err) {
        console.error('Failed to load accounts:', err);
        this.error = err.message;
        this.items = [...seedAccounts];
      } finally {
        this.isLoading = false;
      }
    },
    async addAccount(payload) {
      const { useAuth } = await import('@/composables/useAuth');
      const { useSupabaseData } = await import('@/composables/useSupabaseData');

      const auth = useAuth();
      const data = useSupabaseData();

      if (!auth.userId.value) return null;

      try {
        const newAcc = await data.createAccount({
          user_id: auth.userId.value,
          name: payload.name,
          type: payload.type.toUpperCase(),
          balance: payload.balance || 0,
          currency: payload.currency || 'LKR',
        });

        if (newAcc && newAcc.length > 0) {
          const a = newAcc[0];
          const item = {
            id: a.id,
            name: a.name,
            type: a.type.toLowerCase(),
            balance: a.balance,
            currency: a.currency,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
          };
          this.items.push(item);
          return a.id;
        }
      } catch (err) {
        console.error('Failed to add account:', err);
        this.error = err.message;
        // Fallback: add to local state
        const id = `acc-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
        this.items.push({ id, ...payload });
        return id;
      }
    },
  },
});
