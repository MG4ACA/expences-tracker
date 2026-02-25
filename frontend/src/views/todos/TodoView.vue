<template>
  <div class="flex flex-column gap-4">
    <!-- Toolbar -->
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="flex gap-2">
        <SelectButton
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
        />
      </div>
      <Button label="Add Task" icon="pi pi-plus" @click="openDialog()" />
    </div>

    <!-- Todo list -->
    <div class="flex flex-column gap-2">
      <div v-if="filteredTodos.length === 0" class="text-center py-6 text-gray-400">
        <i class="pi pi-check-circle text-4xl mb-3 block"></i>
        No tasks here!
      </div>

      <div
        v-for="todo in filteredTodos"
        :key="todo.id"
        class="surface-card p-3 border-round-xl shadow-1 flex align-items-start gap-3"
        :class="{ 'opacity-60': todo.status === 'done' }"
      >
        <!-- Status toggle -->
        <Checkbox
          :model-value="todo.status === 'done'"
          :binary="true"
          @change="toggleDone(todo)"
          class="mt-1"
        />

        <div class="flex-1">
          <div class="flex align-items-center gap-2 flex-wrap">
            <span
              class="font-medium"
              :class="todo.status === 'done' ? 'line-through text-gray-400' : ''"
            >
              {{ todo.title }}
            </span>
            <Tag
              :value="todo.priority"
              :severity="prioritySeverity(todo.priority)"
              style="font-size: 0.7rem"
            />
            <Tag
              :value="todo.status.replace('_', ' ')"
              severity="secondary"
              style="font-size: 0.7rem"
            />
          </div>
          <div v-if="todo.description" class="text-sm text-gray-500 mt-1">
            {{ todo.description }}
          </div>
          <div
            v-if="todo.due_date"
            class="text-xs mt-1"
            :class="isOverdue(todo) ? 'text-red-500' : 'text-gray-400'"
          >
            <i class="pi pi-calendar mr-1"></i>
            Due: {{ formatDate(todo.due_date) }}
            <span v-if="isOverdue(todo)">· Overdue</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(todo)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="deleteTodo(todo.id)"
          />
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editItem ? 'Edit Task' : 'New Task'"
      modal
      style="width: 440px"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div>
          <label class="text-sm font-medium block mb-1">Title *</label>
          <InputText v-model="form.title" class="w-full" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Description</label>
          <Textarea v-model="form.description" class="w-full" rows="2" />
        </div>
        <div class="grid">
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Priority</label>
            <Dropdown
              v-model="form.priority"
              :options="priorityOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Status</label>
            <Dropdown
              v-model="form.status"
              :options="statusOptions.filter((o) => o.value)"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Due Date</label>
            <Calendar v-model="form.due_date" class="w-full" date-format="yy-mm-dd" showClear />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button :label="editItem ? 'Update' : 'Create'" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { todoApi } from '@/api/todos';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const todos = ref([]);
const loading = ref(false);
const statusFilter = ref(null);
const dialogVisible = ref(false);
const editItem = ref(null);
const saving = ref(false);

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const priorityOptions = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const emptyForm = () => ({
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  due_date: null,
});
const form = ref(emptyForm());

const filteredTodos = computed(() =>
  statusFilter.value ? todos.value.filter((t) => t.status === statusFilter.value) : todos.value,
);

function prioritySeverity(p) {
  return { high: 'danger', medium: 'warning', low: 'info' }[p];
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
}
function isOverdue(todo) {
  if (!todo.due_date || todo.status === 'done') return false;
  return new Date(todo.due_date) < new Date(new Date().toDateString());
}

async function load() {
  loading.value = true;
  try {
    todos.value = await todoApi.list();
  } finally {
    loading.value = false;
  }
}

function openDialog(item = null) {
  editItem.value = item;
  form.value = item
    ? { ...item, due_date: item.due_date ? new Date(item.due_date) : null }
    : emptyForm();
  dialogVisible.value = true;
}

async function save() {
  if (!form.value.title) return;
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      due_date:
        form.value.due_date instanceof Date
          ? form.value.due_date.toISOString().slice(0, 10)
          : form.value.due_date,
    };
    if (editItem.value) {
      await todoApi.update(editItem.value.id, payload);
    } else {
      await todoApi.create(payload);
    }
    toast.add({ severity: 'success', summary: 'Saved', life: 2000 });
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleDone(todo) {
  const newStatus = todo.status === 'done' ? 'pending' : 'done';
  await todoApi.update(todo.id, { ...todo, status: newStatus });
  await load();
}

async function deleteTodo(id) {
  await todoApi.remove(id);
  await load();
}

onMounted(load);
</script>
