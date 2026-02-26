import { userApi } from '@/api/users';
import { ref } from 'vue';
import { useApi } from './useApi';

export function useUsers() {
  const { call, loading, error, success, clearError } = useApi();
  const users = ref([]);

  async function load() {
    users.value = await call(() => userApi.list());
  }

  async function create(data) {
    await call(() => userApi.create(data), { silent: true });
    success('User created.');
    await load();
  }

  async function update(id, data) {
    await call(() => userApi.update(id, data), { silent: true });
    success('User updated.');
    await load();
  }

  async function remove(id) {
    await call(() => userApi.remove(id));
    success('User deleted.');
    await load();
  }

  return {
    users,
    loading,
    error,
    clearError,
    load,
    create,
    update,
    remove,
  };
}
