<template>
  <div class="flex flex-column gap-4">
    <div class="flex justify-content-end">
      <Button label="Add User" icon="pi pi-user-plus" @click="openDialog()" />
    </div>

    <div class="surface-card border-round-xl shadow-1 overflow-hidden">
      <DataTable :value="users" :loading="loading" striped-rows responsive-layout="scroll">
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="role" header="Role">
          <template #body="{ data }">
            <Tag :value="data.role" :severity="data.role === 'admin' ? 'danger' : 'info'" />
          </template>
        </Column>
        <Column field="created_at" header="Created" sortable>
          <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
        </Column>
        <Column header="Actions" style="width: 100px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(data)" />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="confirmDelete(data)"
                :disabled="data.id === currentUserId"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editItem ? 'Edit User' : 'Add User'"
      modal
      style="width: 400px"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div>
          <label class="text-sm font-medium block mb-1">Name *</label>
          <InputText v-model="form.name" class="w-full" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Email *</label>
          <InputText v-model="form.email" type="email" class="w-full" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">
            Password {{ editItem ? '(leave blank to keep current)' : '*' }}
          </label>
          <Password
            v-model="form.password"
            :feedback="false"
            toggleMask
            class="w-full"
            inputClass="w-full"
          />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Role</label>
          <Dropdown
            v-model="form.role"
            :options="[
              { label: 'Employee', value: 'employee' },
              { label: 'Admin', value: 'admin' },
            ]"
            option-label="label"
            option-value="value"
            class="w-full"
          />
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
import { userApi } from '@/api/users';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const auth = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

const users = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editItem = ref(null);
const saving = ref(false);
const currentUserId = computed(() => auth.user?.id);

const emptyForm = () => ({ name: '', email: '', password: '', role: 'employee' });
const form = ref(emptyForm());

function formatDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}

async function load() {
  loading.value = true;
  try {
    users.value = await userApi.list();
  } finally {
    loading.value = false;
  }
}

function openDialog(item = null) {
  editItem.value = item;
  form.value = item
    ? { name: item.name, email: item.email, password: '', role: item.role }
    : emptyForm();
  dialogVisible.value = true;
}

async function save() {
  if (!form.value.name || !form.value.email) return;
  if (!editItem.value && !form.value.password) return;
  saving.value = true;
  try {
    if (editItem.value) {
      await userApi.update(editItem.value.id, form.value);
      toast.add({ severity: 'success', summary: 'User updated', life: 2000 });
    } else {
      await userApi.create(form.value);
      toast.add({ severity: 'success', summary: 'User created', life: 2000 });
    }
    dialogVisible.value = false;
    await load();
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.message || 'Error', life: 3000 });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  confirm.require({
    message: `Remove user "${item.name}"?`,
    header: 'Confirm',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await userApi.remove(item.id);
      toast.add({ severity: 'info', summary: 'User deleted', life: 2000 });
      await load();
    },
  });
}

onMounted(load);
</script>
