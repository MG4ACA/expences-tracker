import { defineStore } from 'pinia';

const seedCategories = [];

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    items: [...seedCategories],
    isLoading: false,
    error: null,
  }),
  actions: {
    async loadCategories() {
      const { useAuth } = await import('@/composables/useAuth');
      const { useSupabaseData } = await import('@/composables/useSupabaseData');

      const auth = useAuth();
      const data = useSupabaseData();

      if (!auth.userId.value) return;

      this.isLoading = true;
      this.error = null;
      try {
        const categories = await data.listCategories(auth.userId.value);
        this.items = categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type.toLowerCase(),
          color: c.color,
          icon: c.icon,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      } catch (err) {
        console.error('Failed to load categories:', err);
        this.error = err.message;
        this.items = [...seedCategories];
      } finally {
        this.isLoading = false;
      }
    },
    async addCategory(payload) {
      const { useAuth } = await import('@/composables/useAuth');
      const { useSupabaseData } = await import('@/composables/useSupabaseData');

      const auth = useAuth();
      const data = useSupabaseData();

      if (!auth.userId.value) return null;

      try {
        const newCat = await data.createCategory({
          user_id: auth.userId.value,
          name: payload.name,
          type: payload.type.toUpperCase(),
          color: payload.color,
          icon: payload.icon,
        });

        if (newCat && newCat.length > 0) {
          const c = newCat[0];
          const item = {
            id: c.id,
            name: c.name,
            type: c.type.toLowerCase(),
            color: c.color,
            icon: c.icon,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          };
          this.items.push(item);
          return c.id;
        }
      } catch (err) {
        console.error('Failed to add category:', err);
        this.error = err.message;
        // Fallback: add to local state
        const id = `cat-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
        this.items.push({ id, ...payload });
        return id;
      }
    },
  },
  getters: {
    expenseCategories: (state) => state.items.filter((c) => c.type === 'expense'),
    incomeCategories: (state) => state.items.filter((c) => c.type === 'income'),
  },
});
