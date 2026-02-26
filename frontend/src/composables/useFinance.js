import { financeApi } from '@/api/finance';
import { ref } from 'vue';
import { useApi } from './useApi';

export function useFinance() {
  const { call, loading, error, success, clearError } = useApi();
  const records = ref([]);
  const categories = ref([]);
  const summary = ref({ income: 0, expense: 0, net: 0 });

  // ── Categories ───────────────────────────────────────────────────

  async function loadCategories() {
    categories.value = await call(() => financeApi.getCategories());
  }

  async function createCategory(data) {
    await call(() => financeApi.createCategory(data), { silent: true });
    success('Category added.');
    await loadCategories();
  }

  async function removeCategory(id) {
    await call(() => financeApi.deleteCategory(id));
    success('Category deleted.');
    await loadCategories();
  }

  // ── Records ──────────────────────────────────────────────────────

  async function loadRecords(params = {}) {
    records.value = await call(() => financeApi.getRecords(params));
  }

  async function loadSummary(month) {
    summary.value = await call(() => financeApi.getSummary(month));
  }

  async function loadAll(params = {}) {
    const [recs, sum] = await Promise.all([
      financeApi.getRecords(params),
      financeApi.getSummary(params.month),
    ]);
    records.value = recs;
    summary.value = sum;
  }

  async function createRecord(data) {
    await call(() => financeApi.createRecord(data), { silent: true });
    success('Record added.');
  }

  async function updateRecord(id, data) {
    await call(() => financeApi.updateRecord(id, data), { silent: true });
    success('Record updated.');
  }

  async function removeRecord(id) {
    await call(() => financeApi.deleteRecord(id));
    success('Record deleted.');
  }

  return {
    records,
    categories,
    summary,
    loading,
    error,
    clearError,
    loadCategories,
    createCategory,
    removeCategory,
    loadRecords,
    loadSummary,
    loadAll,
    createRecord,
    updateRecord,
    removeRecord,
  };
}
