<template>
  <div class="flex flex-column gap-4">
    <!-- Toolbar -->
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="flex gap-2 flex-wrap">
        <SelectButton
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
        />
        <Select
          v-model="dateFilter"
          :options="dateFilterOptions"
          option-label="label"
          option-value="value"
          class="w-10rem"
        />
        <Button label="Add Task" icon="pi pi-plus" @click="openDialog()" />
      </div>
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
        class="surface-card p-2 border-round-xl shadow-1 flex align-items-center gap-2"
        :class="{ 'opacity-60': todo.status === 'done' }"
      >
        <!-- Status toggle -->
        <Checkbox
          :model-value="todo.status === 'done'"
          :binary="true"
          @change="toggleDone(todo)"
          class="flex-shrink-0"
        />

        <div class="flex-1 min-w-0">
          <div class="flex align-items-center gap-1 flex-wrap">
            <span
              class="font-medium text-sm"
              :class="todo.status === 'done' ? 'line-through text-gray-400' : ''"
            >
              {{ todo.title }}
            </span>
            <Tag
              :value="todo.priority"
              :severity="prioritySeverity(todo.priority)"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
            <Tag
              :value="todo.status.replace('_', ' ')"
              severity="secondary"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
          </div>
          <div class="flex gap-2 align-items-center flex-wrap" style="margin-top: 2px">
            <span
              v-if="todo.description"
              class="text-xs text-gray-500"
              style="
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 14rem;
              "
            >
              {{ todo.description }}
            </span>
            <span
              v-if="todo.due_date"
              class="text-xs"
              :class="isOverdue(todo) ? 'text-red-500' : 'text-gray-400'"
            >
              <i class="pi pi-calendar" style="font-size: 0.6rem"></i>
              {{ formatDate(todo.due_date) }}
              <span v-if="isOverdue(todo)">· Overdue</span>
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1 flex-shrink-0">
          <Button
            icon="pi pi-eye"
            text
            rounded
            size="small"
            @click="viewDetails(todo)"
            title="View Details"
          />
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
      <div class="flex flex-column gap-3">
        <div>
          <label class="text-sm font-medium block mb-1">Title *</label>
          <InputText v-model="form.title" class="w-full" />
        </div>

        <div class="grid">
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Due Date</label>
            <DatePicker v-model="form.due_date" class="w-full" showClear />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Priority</label>
            <Select
              v-model="form.priority"
              :options="priorityOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Status</label>
            <Select
              v-model="form.status"
              :options="statusOptions.filter((o) => o.value)"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Description</label>
          <Textarea v-model="form.description" class="w-full" rows="2" />
        </div>
      </div>
      <Message v-if="error" severity="error" class="mx-3 mb-2">{{ error }}</Message>
      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button :label="editItem ? 'Update' : 'Create'" :loading="saving" @click="save" />
      </template>
    </Dialog>

    <!-- View Details Dialog -->
    <Dialog v-model:visible="detailsVisible" header="Task Details" modal style="width: 500px">
      <div v-if="viewingTask" class="flex flex-column gap-4">
        <div>
          <label class="text-xs text-gray-400 uppercase font-semibold">Title</label>
          <p class="text-lg font-medium m-0 mt-1">{{ viewingTask.title }}</p>
        </div>

        <div v-if="viewingTask.description">
          <label class="text-xs text-gray-400 uppercase font-semibold">Description</label>
          <p class="text-sm m-0 mt-1" style="white-space: pre-wrap">
            {{ viewingTask.description }}
          </p>
        </div>

        <div class="grid">
          <div class="col-6">
            <label class="text-xs text-gray-400 uppercase font-semibold">Priority</label>
            <div class="mt-1">
              <Tag
                :value="viewingTask.priority"
                :severity="prioritySeverity(viewingTask.priority)"
              />
            </div>
          </div>
          <div class="col-6">
            <label class="text-xs text-gray-400 uppercase font-semibold">Status</label>
            <div class="mt-1">
              <Tag :value="viewingTask.status.replace('_', ' ')" severity="secondary" />
            </div>
          </div>
        </div>

        <div v-if="viewingTask.due_date">
          <label class="text-xs text-gray-400 uppercase font-semibold">Due Date</label>
          <p
            class="text-sm m-0 mt-1"
            :class="isOverdue(viewingTask) ? 'text-red-500 font-medium' : ''"
          >
            {{ formatDate(viewingTask.due_date) }}
            <span v-if="isOverdue(viewingTask)">· Overdue</span>
          </p>
        </div>

        <div class="text-xs text-gray-400 pt-3 border-top">
          <p>Created: {{ formatDatetime(viewingTask.created_at) }}</p>
          <p v-if="viewingTask.updated_at">Updated: {{ formatDatetime(viewingTask.updated_at) }}</p>
        </div>
      </div>

      <template #footer>
        <Button label="Close" text @click="detailsVisible = false" />
        <Button label="Edit" icon="pi pi-pencil" @click="editFromDetails" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useTodos } from '@/composables/useTodos';
import { computed, onMounted, ref } from 'vue';

const { todos, loading, error, clearError, load, create, update, toggleDone, remove } = useTodos();

const statusFilter = ref(null);
const dateFilter = ref('today');
const dialogVisible = ref(false);
const detailsVisible = ref(false);
const editItem = ref(null);
const viewingTask = ref(null);
const saving = ref(false);

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const dateFilterOptions = [
  { label: 'Today & Overdue', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'week' },
  { label: 'All Dates', value: 'all' },
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

const statusSortPriority = {
  pending: 0,
  in_progress: 1,
  done: 2,
};

function getDateRange(filterType) {
  const today = new Date(new Date().toDateString());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return { today, tomorrow, weekEnd };
}

function matchesDateFilter(todo, filterType) {
  if (filterType === 'all' || !todo.due_date) return true;

  const { today, tomorrow, weekEnd } = getDateRange(filterType);
  const dueDate = new Date(new Date(todo.due_date).toDateString());

  if (filterType === 'today') {
    // Today + all overdue tasks
    return dueDate <= today;
  } else if (filterType === 'tomorrow') {
    return dueDate.getTime() === tomorrow.getTime();
  } else if (filterType === 'week') {
    return dueDate > today && dueDate <= weekEnd;
  }

  return true;
}

const filteredTodos = computed(() => {
  let filtered = todos.value;

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter((t) => t.status === statusFilter.value);
  }

  // Apply date filter
  filtered = filtered.filter((t) => matchesDateFilter(t, dateFilter.value));

  // Sort by status priority when viewing "All" statuses
  if (!statusFilter.value) {
    return filtered.sort((a, b) => statusSortPriority[a.status] - statusSortPriority[b.status]);
  }

  return filtered;
});

function prioritySeverity(p) {
  return { high: 'danger', medium: 'warning', low: 'info' }[p];
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
}

function formatDatetime(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(todo) {
  if (!todo.due_date || todo.status === 'done') return false;
  return new Date(todo.due_date) < new Date(new Date().toDateString());
}

function openDialog(item = null) {
  editItem.value = item;
  form.value = item
    ? { ...item, due_date: item.due_date ? new Date(item.due_date) : null }
    : emptyForm();
  clearError();
  dialogVisible.value = true;
}

function viewDetails(item) {
  viewingTask.value = item;
  detailsVisible.value = true;
}

function editFromDetails() {
  detailsVisible.value = false;
  openDialog(viewingTask.value);
}

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function save() {
  if (!form.value.title) return;
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      due_date:
        form.value.due_date instanceof Date
          ? toLocalDateStr(form.value.due_date)
          : form.value.due_date,
    };
    if (editItem.value) {
      await update(editItem.value.id, payload);
    } else {
      await create(payload);
    }
    dialogVisible.value = false;
  } catch {
    // error.value shown inline
  } finally {
    saving.value = false;
  }
}

async function deleteTodo(id) {
  await remove(id);
}

onMounted(load);
</script>
