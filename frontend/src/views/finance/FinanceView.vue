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
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="flex gap-2 align-items-center">
        <InputText v-model="monthFilter" type="month" class="w-10rem" />
        <Dropdown
          v-model="typeFilter"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          placeholder="All Types"
          showClear
          class="w-8rem"
        />
        <RouterLink to="/finance/categories">
          <Button label="Categories" icon="pi pi-list" text />
        </RouterLink>
      </div>
      <Button label="Add Record" icon="pi pi-plus" @click="openDialog()" />
    </div>

    <!-- Records table -->
    <div class="surface-card border-round-xl shadow-1 overflow-hidden">
      <DataTable
        :value="records"
        :loading="loading"
        striped-rows
        paginator
        :rows="20"
        responsive-layout="scroll"
      >
        <Column field="date" header="Date" sortable style="width: 100px">
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>
        <Column field="type" header="Type">
          <template #body="{ data }">
            <Tag :value="data.type" :severity="data.type === 'income' ? 'success' : 'danger'" />
          </template>
        </Column>
        <Column field="category_name" header="Category" />
        <Column field="description" header="Description" />
        <Column field="amount" header="Amount" sortable style="width: 120px">
          <template #body="{ data }">
            <span
              :class="data.type === 'income' ? 'text-green-600' : 'text-red-500'"
              class="font-medium"
            >
              {{ fmt(data.amount) }}
            </span>
          </template>
        </Column>
        <Column header="" style="width: 80px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(data)" />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="deleteRecord(data.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editItem ? 'Edit Record' : 'Add Record'"
      modal
      style="width: 420px"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="grid">
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Type *</label>
            <Dropdown
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
            <Dropdown
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
      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button :label="editItem ? 'Update' : 'Add'" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { financeApi } from '@/api/finance';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();

const records = ref([]);
const categories = ref([]);
const summary = ref({ income: 0, expense: 0, net: 0 });
const loading = ref(false);
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
  loading.value = true;
  try {
    const params = {};
    if (monthFilter.value) params.month = monthFilter.value;
    if (typeFilter.value) params.type = typeFilter.value;
    [records.value, summary.value] = await Promise.all([
      financeApi.getRecords(params),
      financeApi.getSummary(monthFilter.value),
    ]);
  } finally {
    loading.value = false;
  }
}

watch([monthFilter, typeFilter], load);

function openDialog(item = null) {
  editItem.value = item;
  form.value = item ? { ...item, date: new Date(item.date) } : emptyForm();
  dialogVisible.value = true;
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
      await financeApi.updateRecord(editItem.value.id, payload);
    } else {
      await financeApi.createRecord(payload);
    }
    toast.add({ severity: 'success', summary: 'Saved', life: 2000 });
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function deleteRecord(id) {
  await financeApi.deleteRecord(id);
  toast.add({ severity: 'info', summary: 'Deleted', life: 2000 });
  await load();
}

onMounted(async () => {
  categories.value = await financeApi.getCategories();
  await load();
});
</script>
