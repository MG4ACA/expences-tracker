import { businessApi } from '@/api/businesses';
import { ref } from 'vue';
import { useApi } from './useApi';

export function useBusinesses() {
  const { call, loading, error, success, clearError } = useApi();
  const businesses = ref([]);
  const current = ref(null);
  const calls = ref([]);

  async function load() {
    businesses.value = await call(() => businessApi.list());
  }

  async function loadOne(id) {
    current.value = await call(() => businessApi.get(id));
  }

  async function create(data) {
    await call(() => businessApi.create(data), { silent: true });
    success('Business added successfully.');
    await load();
  }

  async function update(id, data) {
    await call(() => businessApi.update(id, data), { silent: true });
    success('Business updated.');
  }

  async function updateCurrent(data) {
    if (!current.value) return;
    await update(current.value.id, { ...current.value, ...data });
    current.value = { ...current.value, ...data };
  }

  async function remove(id) {
    await call(() => businessApi.remove(id));
    success('Business deleted.');
    await load();
  }

  // ── Cold Calls ──────────────────────────────────────────────────

  async function loadCalls(businessId) {
    calls.value = await call(() => businessApi.getCalls(businessId));
  }

  async function addCall(businessId, data) {
    await call(() => businessApi.addCall(businessId, data), { silent: true });
    success('Call logged.');
    await loadCalls(businessId);
  }

  async function removeCall(callId, businessId) {
    await call(() => businessApi.deleteCall(callId));
    await loadCalls(businessId);
  }

  return {
    businesses,
    current,
    calls,
    loading,
    error,
    clearError,
    load,
    loadOne,
    create,
    update,
    updateCurrent,
    remove,
    loadCalls,
    addCall,
    removeCall,
  };
}
