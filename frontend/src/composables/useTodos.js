import { todoApi } from '@/api/todos';
import { ref } from 'vue';
import { useApi } from './useApi';

export function useTodos() {
  const { call, loading, error, success, clearError } = useApi();
  const todos = ref([]);

  async function load(params = {}) {
    todos.value = await call(() => todoApi.list(params));
  }

  async function create(data) {
    await call(() => todoApi.create(data), { silent: true });
    success('Task created.');
    await load();
  }

  async function update(id, data) {
    await call(() => todoApi.update(id, data), { silent: true });
    await load();
  }

  async function toggleDone(todo) {
    const newStatus = todo.status === 'done' ? 'pending' : 'done';
    const d = todo.due_date ? new Date(todo.due_date) : null;
    const updateData = {
      ...todo,
      status: newStatus,
      due_date: d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : null,
    };
    await call(() => todoApi.update(todo.id, updateData));
    await load();
  }

  async function remove(id) {
    await call(() => todoApi.remove(id));
    success('Task deleted.');
    await load();
  }

  return {
    todos,
    loading,
    error,
    clearError,
    load,
    create,
    update,
    toggleDone,
    remove,
  };
}
