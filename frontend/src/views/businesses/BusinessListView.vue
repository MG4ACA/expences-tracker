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

    <!-- Business cards -->
    <div class="flex flex-column gap-2">
      <div v-if="loading" class="text-center py-6 text-gray-400">
        <i class="pi pi-spin pi-spinner text-4xl mb-3 block"></i>
        Loading…
      </div>
      <div v-else-if="filteredBusinesses.length === 0" class="text-center py-6 text-gray-400">
        <i class="pi pi-building text-4xl mb-3 block"></i>
        No businesses found.
      </div>

      <div
        v-for="biz in filteredBusinesses"
        :key="biz.id"
        class="surface-card p-3 border-round-xl shadow-1 flex align-items-start gap-3"
      >
        <!-- Icon -->
        <div
          class="flex align-items-center justify-content-center border-round-lg surface-100"
          style="width: 40px; height: 40px; flex-shrink: 0"
        >
          <i class="pi pi-building text-primary"></i>
        </div>

        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <div class="flex align-items-center gap-2 flex-wrap">
            <RouterLink
              :to="`/businesses/${biz.id}`"
              class="font-semibold text-primary no-underline"
            >
              {{ biz.name }}
            </RouterLink>
            <Tag
              :value="biz.status"
              :severity="statusSeverity(biz.status)"
              style="font-size: 0.7rem"
            />
            <Tag v-if="biz.type" :value="biz.type" severity="secondary" style="font-size: 0.7rem" />
          </div>
          <div class="flex gap-3 flex-wrap mt-1">
            <span v-if="biz.city" class="text-sm text-gray-500">
              <i class="pi pi-map-marker mr-1"></i>
              {{ biz.city }}
            </span>
            <span v-if="biz.phone" class="text-sm text-gray-500">
              <i class="pi pi-phone mr-1"></i>
              {{ biz.phone }}
            </span>
            <span v-if="biz.assigned_name" class="text-sm text-gray-500">
              <i class="pi pi-user mr-1"></i>
              {{ biz.assigned_name }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(biz)" />
          <Button
            v-if="auth.isAdmin"
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="confirmDelete(biz)"
          />
        </div>
      </div>
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

function fillSample() {
  form.value = {
    name: 'Colombo Hair Studio',
    type: 'Saloon',
    phone: '0771234567',
    address: '45 Galle Road, Colombo 03',
    city: 'Colombo',
    google_maps_url: 'https://maps.google.com/?q=Colombo+Hair+Studio',
    website: '',
    status: 'new',
    notes: 'No website found. Owner expressed interest when visited in person.',
  };
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
