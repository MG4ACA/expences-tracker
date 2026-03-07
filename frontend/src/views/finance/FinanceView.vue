<template>
  <div class="flex flex-column gap-4">
    <!-- Summary bar -->
    <div class="grid">
      <div class="col-4">
        <div class="surface-card p-3 border-round-xl shadow-1 text-center">
          <div class="text-xs text-gray-400 mb-1">Income</div>
          <div class="text-xl font-bold text-green-500">{{ fmt(summary.income) }}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="surface-card p-3 border-round-xl shadow-1 text-center">
          <div class="text-xs text-gray-400 mb-1">Expenses</div>
          <div class="text-xl font-bold text-red-500">{{ fmt(summary.expense) }}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="surface-card p-3 border-round-xl shadow-1 text-center">
          <div class="text-xs text-gray-400 mb-1">Net</div>
          <div
            class="text-xl font-bold"
            :class="summary.net >= 0 ? 'text-green-600' : 'text-red-500'"
          >
            {{ fmt(summary.net) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="finance-toolbar flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="flex gap-1 align-items-center finance-filter-group">
        <InputText
          v-model="monthFilter"
          type="month"
          style="flex: 1; min-width: 0; max-width: 10rem"
        />
        <Select
          v-model="typeFilter"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          placeholder="Type"
          showClear
          style="width: 7rem; flex-shrink: 0"
        />
        <RouterLink to="/finance/categories">
          <Button icon="pi pi-list" v-tooltip.top="'Categories'" text rounded size="small" />
        </RouterLink>
        <Button icon="pi pi-plus" @click="openDialog()" size="small" />
      </div>
    </div>

    <!-- Finance record cards -->
    <div class="flex flex-column gap-2">
      <div v-if="loading" class="text-center py-6 text-gray-400">
        <i class="pi pi-spin pi-spinner text-4xl mb-3 block"></i>
        Loading…
      </div>
      <div v-else-if="records.length === 0" class="text-center py-6 text-gray-400">
        <i class="pi pi-wallet text-4xl mb-3 block"></i>
        No records for this period.
      </div>

      <div
        v-for="rec in records"
        :key="rec.id"
        class="surface-card p-2 border-round-xl shadow-1 flex align-items-center gap-2"
      >
        <!-- Type icon -->
        <div
          class="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
          :class="rec.type === 'income' ? 'bg-green-50' : 'bg-red-50'"
          style="width: 34px; height: 34px"
        >
          <i
            :class="
              rec.type === 'income'
                ? 'pi pi-arrow-down text-green-500'
                : 'pi pi-arrow-up text-red-500'
            "
            style="font-size: 0.8rem"
          ></i>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Amount + tags on one line -->
          <div class="flex align-items-center gap-1 flex-wrap">
            <span
              class="font-semibold text-sm"
              :class="rec.type === 'income' ? 'text-green-600' : 'text-red-500'"
            >
              {{ fmt(rec.amount) }}
            </span>
            <Tag
              :value="rec.type"
              :severity="rec.type === 'income' ? 'success' : 'danger'"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
            <Tag
              v-if="rec.category_name"
              :value="rec.category_name"
              severity="secondary"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
          </div>
          <!-- Description + date -->
          <div class="flex gap-2 align-items-center flex-wrap" style="margin-top: 2px">
            <span
              v-if="rec.description"
              class="text-xs text-gray-500"
              style="
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 12rem;
              "
            >
              {{ rec.description }}
            </span>
            <span class="text-xs text-gray-400">
              <i class="pi pi-calendar" style="font-size: 0.6rem"></i>
              {{ formatDate(rec.date) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1 flex-shrink-0">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(rec)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="deleteRecord_(rec.id)"
          />
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editItem ? 'Edit Record' : 'Add Record'"
      modal
      style="width: 420px"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="flex justify-content-end">
          <Button
            label="Fill Sample Data"
            icon="pi pi-bolt"
            size="small"
            text
            severity="secondary"
            @click="fillSample"
          />
        </div>
        <div class="grid">
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Type *</label>
            <Select
              v-model="form.type"
              :options="typeOptions.filter((o) => o.value)"
              option-label="label"
              option-value="value"
              class="w-full"
              @change="form.category_id = null"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Date *</label>
            <Calendar v-model="form.date" class="w-full" date-format="yy-mm-dd" />
          </div>
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Category</label>
            <Select
              v-model="form.category_id"
              :options="filteredCategories"
              option-label="name"
              option-value="id"
              class="w-full"
              showClear
              placeholder="Select category"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Amount *</label>
            <InputNumber v-model="form.amount" class="w-full" :min="0" :minFractionDigits="2" />
          </div>
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Description</label>
            <InputText v-model="form.description" class="w-full" />
          </div>
        </div>
      </div>
      <Message v-if="error" severity="error" class="mx-3 mb-2">{{ error }}</Message>
      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button :label="editItem ? 'Update' : 'Add'" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useFinance } from '@/composables/useFinance';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { computed, onMounted, ref, watch } from 'vue';

const {
  records,
  categories,
  summary,
  loading,
  error,
  clearError,
  loadCategories,
  loadAll,
  createRecord,
  updateRecord,
  removeRecord,
} = useFinance();

const monthFilter = ref(new Date().toISOString().slice(0, 7));
const typeFilter = ref(null);
const dialogVisible = ref(false);
const editItem = ref(null);
const saving = ref(false);

const typeOptions = [
  { label: 'All', value: null },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];

const emptyForm = () => ({
  type: 'expense',
  category_id: null,
  amount: null,
  description: '',
  date: new Date(),
});
const form = ref(emptyForm());

const filteredCategories = computed(() =>
  categories.value.filter((c) => c.type === form.value.type),
);

function fmt(v) {
  return `LKR ${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
function formatDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}

async function load() {
  const params = {};
  if (monthFilter.value) params.month = monthFilter.value;
  if (typeFilter.value) params.type = typeFilter.value;
  await loadAll(params);
}

watch([monthFilter, typeFilter], load);

function openDialog(item = null) {
  editItem.value = item;
  form.value = item ? { ...item, date: new Date(item.date) } : emptyForm();
  clearError();
  dialogVisible.value = true;
}

function fillSample() {
  const incomecat = categories.value.find((c) => c.type === 'income');
  const expensecat = categories.value.find((c) => c.type === 'expense');
  form.value = {
    type: 'income',
    category_id: incomecat?.id ?? null,
    amount: 75000,
    description: 'Project payment — Lumicore Labs website build',
    date: new Date(),
  };
  // If no income category exists, try expense as fallback
  if (!incomecat && expensecat) {
    form.value.type = 'expense';
    form.value.category_id = expensecat.id;
    form.value.amount = 3500;
    form.value.description = 'Office supplies';
  }
}

async function save() {
  if (!form.value.type || !form.value.amount || !form.value.date) return;
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      date:
        form.value.date instanceof Date
          ? form.value.date.toISOString().slice(0, 10)
          : form.value.date,
    };
    if (editItem.value) {
      await updateRecord(editItem.value.id, payload);
    } else {
      await createRecord(payload);
    }
    dialogVisible.value = false;
    await load();
  } catch {
    // error.value shown inline in dialog
  } finally {
    saving.value = false;
  }
}

async function deleteRecord_(id) {
  await removeRecord(id);
  await load();
}

onMounted(async () => {
  await Promise.all([loadCategories(), load()]);
});
</script>

<style scoped>
.finance-toolbar {
  flex-wrap: wrap;
}
.finance-filter-group {
  flex: 1;
  min-width: 0;
}
@media (max-width: 480px) {
  .finance-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .finance-filter-group {
    width: 100%;
  }
}
</style>
