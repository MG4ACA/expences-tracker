<template>
  <div class="flex flex-column gap-4">
    <div class="flex justify-content-end">
      <Button label="Add User" icon="pi pi-user-plus" @click="openDialog()" />
    </div>

    <!-- User cards -->
    <div class="flex flex-column gap-2">
      <div v-if="loading" class="text-center py-6 text-gray-400">
        <i class="pi pi-spin pi-spinner text-4xl mb-3 block"></i>
        Loading…
      </div>
      <div v-else-if="users.length === 0" class="text-center py-6 text-gray-400">
        <i class="pi pi-users text-4xl mb-3 block"></i>
        No users found.
      </div>

      <div
        v-for="user in users"
        :key="user.id"
        class="surface-card p-3 border-round-xl shadow-1 flex align-items-start gap-3"
      >
        <!-- Avatar -->
        <div
          class="flex align-items-center justify-content-center border-round-lg surface-100 font-bold text-primary"
          style="width: 40px; height: 40px; flex-shrink: 0; font-size: 1rem"
        >
          {{ user.name?.charAt(0).toUpperCase() }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex align-items-center gap-2 flex-wrap">
            <span class="font-semibold">{{ user.name }}</span>
            <Tag
              :value="user.role"
              :severity="user.role === 'admin' ? 'danger' : 'info'"
              style="font-size: 0.7rem"
            />
          </div>
          <div class="flex gap-3 flex-wrap mt-1">
            <span class="text-sm text-gray-500">
              <i class="pi pi-envelope mr-1"></i>
              {{ user.email }}
            </span>
            <span class="text-xs text-gray-400">
              <i class="pi pi-calendar mr-1"></i>
              Joined {{ formatDate(user.created_at) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(user)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            :disabled="user.id === currentUserId"
            @click="confirmDelete(user)"
          />
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editItem ? 'Edit User' : 'Add User'"
      modal
      style="width: 400px"
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
      <Message v-if="error" severity="error" class="mx-3 mb-2">{{ error }}</Message>
      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button :label="editItem ? 'Update' : 'Create'" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useUsers } from '@/composables/useUsers';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';

const auth = useAuthStore();
const confirm = useConfirm();
const { users, loading, error, clearError, load, create, update, remove } = useUsers();

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

function openDialog(item = null) {
  editItem.value = item;
  form.value = item
    ? { name: item.name, email: item.email, password: '', role: item.role }
    : emptyForm();
  clearError();
  dialogVisible.value = true;
}

function fillSample() {
  form.value = {
    name: 'Kasun Perera',
    email: 'kasun@lumicorelabs.com',
    password: 'test1234',
    role: 'employee',
  };
}

async function save() {
  if (!form.value.name || !form.value.email) return;
  if (!editItem.value && !form.value.password) return;
  saving.value = true;
  try {
    if (editItem.value) {
      await update(editItem.value.id, form.value);
    } else {
      await create(form.value);
    }
    dialogVisible.value = false;
  } catch {
    // error.value shown inline
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
      await remove(item.id);
    },
  });
}

onMounted(load);
</script>
