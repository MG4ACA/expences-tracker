<template>
  <div class="flex flex-column gap-4">
    <!-- ── Toolbar ──────────────────────────────────────────────────── -->
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <InputText v-model="search" placeholder="Search deployments…" class="w-15rem" />
      <div class="flex gap-2">
        <Button
          label="Manage VPS"
          icon="pi pi-server"
          severity="secondary"
          outlined
          @click="openVpsManager"
        />
        <Button label="Add Deployment" icon="pi pi-plus" @click="openDepDialog()" />
      </div>
    </div>

    <!-- ── Loading ──────────────────────────────────────────────────── -->
    <div v-if="loading" class="text-center py-6 text-gray-400">
      <i class="pi pi-spin pi-spinner text-4xl mb-3 block"></i>
      Loading…
    </div>

    <!-- ── Empty ────────────────────────────────────────────────────── -->
    <div v-else-if="filtered.length === 0" class="text-center py-6 text-gray-400">
      <i class="pi pi-server text-4xl mb-3 block"></i>
      No deployments found.
    </div>

    <!-- ── Deployment cards ──────────────────────────────────────────── -->
    <div v-else class="flex flex-column gap-2">
      <div
        v-for="dep in filtered"
        :key="dep.id"
        class="surface-card p-2 border-round-xl shadow-1 flex align-items-center gap-2"
      >
        <!-- Status colour strip -->
        <div
          class="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
          :class="statusBg(dep.status)"
          style="width: 34px; height: 34px"
        >
          <i class="pi pi-bolt" style="font-size: 0.8rem" :class="statusIcon(dep.status)"></i>
        </div>

        <!-- Main info -->
        <div class="flex-1 min-w-0">
          <!-- Row 1: app name + badges -->
          <div class="flex align-items-center gap-1 flex-wrap">
            <span class="font-semibold text-primary text-sm">{{ dep.pm2_app_name }}</span>
            <Tag
              :value="dep.status"
              :severity="statusSeverity(dep.status)"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
            <Tag
              :value="`port ${dep.port}`"
              severity="secondary"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
          </div>

          <!-- Row 2: meta (compact, all on one line) -->
          <div class="flex gap-2 flex-wrap" style="margin-top: 2px">
            <span class="text-xs text-gray-500">
              <i class="pi pi-building" style="font-size: 0.6rem"></i>
              {{ dep.business_name || '—' }}
            </span>
            <span v-if="dep.vps_label" class="text-xs text-gray-500">
              <i class="pi pi-server" style="font-size: 0.6rem"></i>
              {{ dep.vps_label }}
            </span>
            <span v-if="dep.vps_path" class="text-xs text-gray-400">
              <i class="pi pi-folder" style="font-size: 0.6rem"></i>
              {{ dep.vps_path }}
            </span>
            <span v-if="dep.last_seen_at" class="text-xs text-gray-400">
              <i class="pi pi-clock" style="font-size: 0.6rem"></i>
              {{ formatDate(dep.last_seen_at) }}
            </span>
          </div>

          <!-- Notes -->
          <p
            v-if="dep.notes"
            class="text-xs text-gray-400 m-0"
            style="margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
          >
            {{ dep.notes }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-1 flex-shrink-0">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDepDialog(dep)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="confirmDeleteDep(dep)"
          />
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         Add / Edit Deployment Dialog
    ══════════════════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="depDialogVisible"
      :header="editDep ? 'Edit Deployment' : 'Add Deployment'"
      modal
      class="w-full"
      style="max-width: 520px"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="grid">
          <!-- Business -->
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Business *</label>
            <Dropdown
              v-model="depForm.business_id"
              :options="businesses"
              option-label="name"
              option-value="id"
              placeholder="Select a business"
              filter
              class="w-full"
            />
          </div>

          <!-- PM2 App Name -->
          <div class="col-12 md:col-6">
            <label class="text-sm font-medium block mb-1">PM2 App Name *</label>
            <InputText
              v-model="depForm.pm2_app_name"
              class="w-full"
              placeholder="e.g. pharmacy-pos-backend"
            />
          </div>

          <!-- Port -->
          <div class="col-12 md:col-6">
            <label class="text-sm font-medium block mb-1">Port *</label>
            <InputText
              v-model="depForm.port"
              class="w-full"
              placeholder="e.g. 3000"
              type="number"
            />
          </div>

          <!-- VPS Server -->
          <div class="col-12 md:col-6">
            <label class="text-sm font-medium block mb-1">VPS Server</label>
            <Dropdown
              v-model="depForm.vps_id"
              :options="vpsList"
              option-label="label"
              option-value="id"
              placeholder="Select VPS"
              showClear
              class="w-full"
            />
          </div>

          <!-- VPS Path -->
          <div class="col-12 md:col-6">
            <label class="text-sm font-medium block mb-1">VPS Path</label>
            <InputText v-model="depForm.vps_path" class="w-full" placeholder="/var/www/x" />
          </div>

          <!-- Status -->
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Status</label>
            <Dropdown
              v-model="depForm.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>

          <!-- Notes -->
          <div class="col-12">
            <label class="text-sm font-medium block mb-1">Notes</label>
            <Textarea v-model="depForm.notes" class="w-full" rows="2" />
          </div>
        </div>
      </div>
      <Message v-if="depError" severity="error" :closable="false" class="mt-2">
        {{ depError }}
      </Message>
      <template #footer>
        <Button label="Cancel" text @click="depDialogVisible = false" />
        <Button :label="editDep ? 'Update' : 'Create'" :loading="saving" @click="saveDep" />
      </template>
    </Dialog>

    <!-- ══════════════════════════════════════════════════════════════
         VPS Manager Dialog
    ══════════════════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="vpsManagerVisible"
      header="VPS Servers"
      modal
      class="w-full"
      style="max-width: 560px"
    >
      <!-- VPS list -->
      <div class="flex flex-column gap-2 mb-3">
        <div v-if="vpsList.length === 0" class="text-center py-4 text-gray-400">
          No VPS servers yet.
        </div>
        <div
          v-for="vps in vpsList"
          :key="vps.id"
          class="surface-100 p-3 border-round-lg flex align-items-start gap-2"
        >
          <div class="flex-1 min-w-0">
            <div class="font-semibold">{{ vps.label }}</div>
            <div class="text-sm text-gray-500">{{ vps.host }}</div>
            <div v-if="vps.notes" class="text-sm text-gray-400 mt-1">{{ vps.notes }}</div>
          </div>
          <div class="flex gap-1">
            <Button icon="pi pi-pencil" text rounded size="small" @click="openVpsDialog(vps)" />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="confirmDeleteVps(vps)"
            />
          </div>
        </div>
      </div>

      <!-- Add / Edit VPS inline form -->
      <Divider />
      <div class="text-sm font-semibold mb-2">
        {{ editVps ? 'Edit VPS Server' : 'Add New VPS Server' }}
      </div>
      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="text-sm font-medium block mb-1">Label *</label>
          <InputText v-model="vpsForm.label" class="w-full" placeholder="e.g. Hostinger VPS 1" />
        </div>
        <div class="col-12 md:col-6">
          <label class="text-sm font-medium block mb-1">Host / IP *</label>
          <InputText v-model="vpsForm.host" class="w-full" placeholder="192.168.x.x" />
        </div>
        <div class="col-12">
          <label class="text-sm font-medium block mb-1">Notes</label>
          <InputText v-model="vpsForm.notes" class="w-full" />
        </div>
      </div>
      <Message v-if="vpsError" severity="error" :closable="false" class="mt-2">
        {{ vpsError }}
      </Message>

      <template #footer>
        <Button v-if="editVps" label="Cancel Edit" text @click="resetVpsForm" />
        <Button :label="editVps ? 'Update VPS' : 'Add VPS'" :loading="vpsaving" @click="saveVps" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { businessApi } from '@/api/businesses';
import { deploymentApi } from '@/api/deployments';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const confirm = useConfirm();
const toast = useToast();

// ── State ────────────────────────────────────────────────────────────
const deployments = ref([]);
const vpsList = ref([]);
const businesses = ref([]);
const loading = ref(false);
const search = ref('');

// Deployment dialog
const depDialogVisible = ref(false);
const editDep = ref(null);
const saving = ref(false);
const depError = ref('');
const emptyDepForm = () => ({
  business_id: null,
  vps_id: null,
  pm2_app_name: '',
  port: '',
  vps_path: '',
  status: 'unknown',
  notes: '',
});
const depForm = ref(emptyDepForm());

// VPS manager dialog
const vpsManagerVisible = ref(false);
const editVps = ref(null);
const vpsaving = ref(false);
const vpsError = ref('');
const emptyVpsForm = () => ({ label: '', host: '', notes: '' });
const vpsForm = ref(emptyVpsForm());

// ── Constants ────────────────────────────────────────────────────────
const statusOptions = [
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Error', value: 'error' },
  { label: 'Unknown', value: 'unknown' },
];

// ── Computed ─────────────────────────────────────────────────────────
const filtered = computed(() => {
  if (!search.value) return deployments.value;
  const q = search.value.toLowerCase();
  return deployments.value.filter(
    (d) =>
      d.pm2_app_name?.toLowerCase().includes(q) ||
      d.business_name?.toLowerCase().includes(q) ||
      d.vps_label?.toLowerCase().includes(q) ||
      String(d.port).includes(q),
  );
});

// ── Helpers ──────────────────────────────────────────────────────────
function statusSeverity(s) {
  return (
    { online: 'success', offline: 'danger', error: 'danger', unknown: 'secondary' }[s] ||
    'secondary'
  );
}
function statusBg(s) {
  return (
    { online: 'surface-100', offline: 'surface-100', error: 'surface-100', unknown: 'surface-100' }[
      s
    ] || 'surface-100'
  );
}
function statusIcon(s) {
  return (
    {
      online: 'text-green-500',
      offline: 'text-red-400',
      error: 'text-orange-400',
      unknown: 'text-gray-400',
    }[s] || 'text-gray-400'
  );
}
function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

// ── Data loading ──────────────────────────────────────────────────────
async function loadAll() {
  loading.value = true;
  try {
    [deployments.value, vpsList.value, businesses.value] = await Promise.all([
      deploymentApi.list(),
      deploymentApi.listVps(),
      businessApi.list(),
    ]);
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Load failed', detail: e.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

// ── Deployment CRUD ───────────────────────────────────────────────────
function openDepDialog(item = null) {
  editDep.value = item;
  depError.value = '';
  depForm.value = item ? { ...item, port: String(item.port) } : emptyDepForm();
  depDialogVisible.value = true;
}

async function saveDep() {
  const { business_id, pm2_app_name, port } = depForm.value;
  if (!business_id || !pm2_app_name || !port) {
    depError.value = 'Business, PM2 App Name and Port are required.';
    return;
  }
  saving.value = true;
  depError.value = '';
  try {
    const payload = { ...depForm.value, port: Number(depForm.value.port) };
    if (editDep.value) {
      await deploymentApi.update(editDep.value.id, payload);
      toast.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Deployment updated.',
        life: 3000,
      });
    } else {
      await deploymentApi.create(payload);
      toast.add({
        severity: 'success',
        summary: 'Created',
        detail: 'Deployment added.',
        life: 3000,
      });
    }
    depDialogVisible.value = false;
    await loadAll();
  } catch (e) {
    depError.value = e.response?.data?.message || e.message;
  } finally {
    saving.value = false;
  }
}

function confirmDeleteDep(dep) {
  confirm.require({
    message: `Delete deployment "${dep.pm2_app_name}"? This cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deploymentApi.remove(dep.id);
      toast.add({
        severity: 'info',
        summary: 'Deleted',
        detail: 'Deployment removed.',
        life: 3000,
      });
      await loadAll();
    },
  });
}

// ── VPS CRUD ──────────────────────────────────────────────────────────
function openVpsManager() {
  resetVpsForm();
  vpsManagerVisible.value = true;
}

function openVpsDialog(vps) {
  editVps.value = vps;
  vpsForm.value = { label: vps.label, host: vps.host, notes: vps.notes || '' };
  vpsError.value = '';
}

function resetVpsForm() {
  editVps.value = null;
  vpsForm.value = emptyVpsForm();
  vpsError.value = '';
}

async function saveVps() {
  if (!vpsForm.value.label || !vpsForm.value.host) {
    vpsError.value = 'Label and Host are required.';
    return;
  }
  vpsaving.value = true;
  vpsError.value = '';
  try {
    if (editVps.value) {
      await deploymentApi.updateVps(editVps.value.id, vpsForm.value);
      toast.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'VPS server updated.',
        life: 3000,
      });
    } else {
      await deploymentApi.createVps(vpsForm.value);
      toast.add({
        severity: 'success',
        summary: 'Created',
        detail: 'VPS server added.',
        life: 3000,
      });
    }
    resetVpsForm();
    vpsList.value = await deploymentApi.listVps();
  } catch (e) {
    vpsError.value = e.response?.data?.message || e.message;
  } finally {
    vpsaving.value = false;
  }
}

function confirmDeleteVps(vps) {
  confirm.require({
    message: `Delete VPS "${vps.label}"? Deployments using it will lose their VPS link.`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deploymentApi.removeVps(vps.id);
      toast.add({
        severity: 'info',
        summary: 'Deleted',
        detail: 'VPS server removed.',
        life: 3000,
      });
      vpsList.value = await deploymentApi.listVps();
    },
  });
}

onMounted(loadAll);
</script>
