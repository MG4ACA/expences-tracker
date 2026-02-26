<template>
  <div class="flex flex-column gap-4">
    <!-- Toolbar -->
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="flex align-items-center gap-2">
        <InputText v-model="search" placeholder="Search businesses…" class="w-15rem" />
        <Dropdown
          v-model="filterStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="All Statuses"
          showClear
          class="w-10rem"
        />
      </div>
      <Button label="Add Business" icon="pi pi-plus" @click="openDialog()" />
    </div>

    <!-- Table -->
    <div class="surface-card border-round-xl shadow-1 overflow-hidden">
      <DataTable
        :value="filteredBusinesses"
        :loading="loading"
        stripedRows
        paginator
        :rows="15"
        responsive-layout="scroll"
      >
        <Column field="name" header="Business" sortable>
          <template #body="{ data }">
            <RouterLink
              :to="`/businesses/${data.id}`"
              class="font-medium text-primary no-underline"
            >
              {{ data.name }}
            </RouterLink>
          </template>
        </Column>
        <Column field="type" header="Type" sortable />
        <Column field="city" header="City" sortable />
        <Column field="phone" header="Phone" />
        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag :value="data.status" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <Column field="assigned_name" header="Assigned To" />
        <Column header="Actions" style="width: 100px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(data)" />
              <Button
                v-if="auth.isAdmin"
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editItem ? 'Edit Business' : 'Add Business'"
      modal
      class="w-full"
      style="max-width: 560px"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="grid">
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Business Name *</label>
            <InputText v-model="form.name" class="w-full" />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Type</label>
            <InputText v-model="form.type" class="w-full" placeholder="e.g. Saloon" />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">City</label>
            <InputText v-model="form.city" class="w-full" />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Phone</label>
            <InputText v-model="form.phone" class="w-full" />
          </div>
          <div class="col-6">
            <label class="text-sm font-medium block mb-1">Status</label>
            <Dropdown
              v-model="form.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Address</label>
            <InputText v-model="form.address" class="w-full" />
          </div>
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Google Maps URL</label>
            <InputText v-model="form.google_maps_url" class="w-full" />
          </div>
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">
              Existing Website (leave blank if none)
            </label>
            <InputText v-model="form.website" class="w-full" />
          </div>
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Notes</label>
            <Textarea v-model="form.notes" class="w-full" rows="2" />
          </div>
        </div>
      </div>
      <Message v-if="error" severity="error" :closable="false" class="mt-2">{{ error }}</Message>
      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button :label="editItem ? 'Update' : 'Create'" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useBusinesses } from '@/composables/useBusinesses';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';

const auth = useAuthStore();
const confirm = useConfirm();
const { businesses, loading, error, clearError, load, create, update, remove } = useBusinesses();

const search = ref('');
const filterStatus = ref(null);
const dialogVisible = ref(false);
const editItem = ref(null);
const saving = ref(false);

const emptyForm = () => ({
  name: '',
  type: '',
  phone: '',
  address: '',
  city: '',
  google_maps_url: '',
  website: '',
  status: 'new',
  notes: '',
});
const form = ref(emptyForm());

const statusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Interested', value: 'interested' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Converted', value: 'converted' },
];

const filteredBusinesses = computed(() => {
  let list = businesses.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (b) => b.name.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q),
    );
  }
  if (filterStatus.value) list = list.filter((b) => b.status === filterStatus.value);
  return list;
});

function statusSeverity(s) {
  return (
    {
      new: 'info',
      contacted: 'warning',
      interested: 'success',
      rejected: 'danger',
      converted: 'success',
    }[s] || 'secondary'
  );
}

function openDialog(item = null) {
  editItem.value = item;
  form.value = item ? { ...item } : emptyForm();
  clearError();
  dialogVisible.value = true;
}

async function save() {
  if (!form.value.name) return;
  saving.value = true;
  try {
    if (editItem.value) {
      await update(editItem.value.id, form.value);
    } else {
      await create(form.value);
    }
    dialogVisible.value = false;
  } catch {
    // error.value is set by the composable — shown inline in dialog
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  confirm.require({
    message: `Delete "${item.name}"? This cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => remove(item.id),
  });
}

onMounted(load);
</script>
