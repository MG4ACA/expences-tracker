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
        class="surface-card p-2 border-round-xl shadow-1 flex align-items-center gap-2"
      >
        <!-- Avatar -->
        <div
          class="flex align-items-center justify-content-center border-round-lg surface-100 font-bold text-primary flex-shrink-0"
          style="width: 34px; height: 34px; font-size: 0.9rem"
        >
          {{ user.name?.charAt(0).toUpperCase() }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex align-items-center gap-1 flex-wrap">
            <span class="font-semibold text-sm">{{ user.name }}</span>
            <Tag
              :value="user.role"
              :severity="user.role === 'admin' ? 'danger' : 'info'"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
          </div>
          <div class="flex gap-2 flex-wrap" style="margin-top: 2px">
            <span class="text-xs text-gray-500">
              <i class="pi pi-envelope" style="font-size: 0.6rem"></i>
              {{ user.email }}
            </span>
            <span class="text-xs text-gray-400">
              <i class="pi pi-calendar" style="font-size: 0.6rem"></i>
              {{ formatDate(user.created_at) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1 flex-shrink-0">
          <Button
            v-if="user.role === 'employee'"
            icon="pi pi-briefcase"
            text
            rounded
            size="small"
            severity="info"
            v-tooltip.top="'Assign Businesses'"
            @click="openAssignDialog(user)"
          />
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
          <Select
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

    <!-- Assign Businesses Sidebar -->
    <Sidebar
      v-model:visible="assignSidebarVisible"
      position="right"
      style="width: 26rem"
      :pt="{ header: { style: 'padding-bottom: 0' } }"
    >
      <template #header>
        <div class="flex flex-column gap-1 w-full">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-briefcase text-primary"></i>
            <span class="font-semibold text-base">Assign Businesses</span>
          </div>
          <span class="text-xs text-gray-400">{{ assignTarget?.name }}</span>
        </div>
      </template>

      <div class="flex flex-column gap-3 pt-2" style="height: 100%; overflow: hidden">
        <!-- Filter + counts -->
        <div class="flex align-items-center gap-2">
          <Select
            v-model="assignFilter"
            :options="assignStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="All statuses"
            showClear
            class="flex-1"
            @change="assignPage = 0"
          />
          <span class="text-xs text-gray-400 flex-shrink-0">
            {{ selectedBizIds.length }} selected
          </span>
        </div>

        <!-- Select all on current page / clear all -->
        <div class="flex gap-2">
          <Button label="Select page" size="small" text @click="selectPage" />
          <Button
            label="Clear all"
            size="small"
            text
            severity="secondary"
            @click="selectedBizIds = []"
          />
        </div>

        <!-- Business list -->
        <div class="flex flex-column gap-1" style="flex: 1; overflow-y: auto">
          <div
            v-for="biz in pagedBusinesses"
            :key="biz.id"
            class="flex align-items-center gap-2 p-2 border-round cursor-pointer"
            :class="selectedBizIds.includes(biz.id) ? 'surface-100' : 'hover:surface-50'"
            @click="toggleBiz(biz.id)"
          >
            <Checkbox
              :modelValue="selectedBizIds.includes(biz.id)"
              :binary="true"
              @click.stop
              @change="toggleBiz(biz.id)"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">{{ biz.name }}</div>
              <div class="flex align-items-center gap-1 flex-wrap mt-1">
                <Tag
                  :value="biz.status"
                  :severity="bizStatusSeverity(biz.status)"
                  style="font-size: 0.58rem; padding: 1px 4px"
                />
                <span v-if="biz.city" class="text-xs text-gray-400">{{ biz.city }}</span>
                <span
                  v-if="biz.assigned_to && biz.assigned_to !== assignTarget?.id"
                  class="text-xs text-orange-500"
                >
                  · {{ biz.assigned_name }}
                </span>
              </div>
            </div>
          </div>
          <div
            v-if="filteredAssignBusinesses.length === 0"
            class="text-center text-gray-400 py-6 text-sm"
          >
            No businesses match.
          </div>
        </div>

        <!-- Paginator -->
        <Paginator
          v-if="filteredAssignBusinesses.length > assignPageSize"
          :rows="assignPageSize"
          :totalRecords="filteredAssignBusinesses.length"
          :first="assignPage * assignPageSize"
          template="PrevPageLink PageLinks NextPageLink"
          @page="(e) => (assignPage = e.page)"
        />

        <!-- Footer actions -->
        <div class="flex gap-2 pt-2 border-top-1 surface-border">
          <Button label="Cancel" text class="flex-1" @click="assignSidebarVisible = false" />
          <Button
            label="Save Assignment"
            :loading="assignSaving"
            class="flex-1"
            @click="saveAssign"
          />
        </div>
        <Message v-if="assignError" severity="error" :closable="false">{{ assignError }}</Message>
      </div>
    </Sidebar>
  </div>
</template>

<script setup>
import { businessApi } from '@/api/businesses';
import { useUsers } from '@/composables/useUsers';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Paginator from 'primevue/paginator';
import Password from 'primevue/password';
import Sidebar from 'primevue/sidebar';
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

// Assign businesses sidebar
const assignSidebarVisible = ref(false);
const assignTarget = ref(null);
const allBusinesses = ref([]);
const selectedBizIds = ref([]);
const assignSaving = ref(false);
const assignError = ref('');
const assignFilter = ref('new');
const assignPage = ref(0);
const assignPageSize = 5;

const assignStatusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Interested', value: 'interested' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Converted', value: 'converted' },
];

const filteredAssignBusinesses = computed(() => {
  if (!assignFilter.value) return allBusinesses.value;
  return allBusinesses.value.filter((b) => b.status === assignFilter.value);
});

const pagedBusinesses = computed(() => {
  const start = assignPage.value * assignPageSize;
  return filteredAssignBusinesses.value.slice(start, start + assignPageSize);
});

function bizStatusSeverity(s) {
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

function toggleBiz(id) {
  const idx = selectedBizIds.value.indexOf(id);
  if (idx === -1) selectedBizIds.value.push(id);
  else selectedBizIds.value.splice(idx, 1);
}

function selectPage() {
  pagedBusinesses.value.forEach((b) => {
    if (!selectedBizIds.value.includes(b.id)) selectedBizIds.value.push(b.id);
  });
}

async function openAssignDialog(user) {
  assignTarget.value = user;
  assignError.value = '';
  assignFilter.value = 'new';
  assignPage.value = 0;
  selectedBizIds.value = [];
  allBusinesses.value = await businessApi.list();
  selectedBizIds.value = allBusinesses.value
    .filter((b) => b.assigned_to === user.id)
    .map((b) => b.id);
  assignSidebarVisible.value = true;
}

async function saveAssign() {
  assignSaving.value = true;
  assignError.value = '';
  try {
    await businessApi.bulkAssign(assignTarget.value.id, selectedBizIds.value);
    assignSidebarVisible.value = false;
  } catch (e) {
    assignError.value = e?.response?.data?.message || 'Failed to save assignment';
  } finally {
    assignSaving.value = false;
  }
}

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
    name: 'Demo User',
    email: 'demo@lumicore-labs.com',
    password: 'demo@123',
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
