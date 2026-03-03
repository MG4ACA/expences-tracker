<template>
  <div class="queue-view flex flex-column gap-4">
    <!-- Header -->
    <div class="flex align-items-start justify-content-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold m-0 mb-1">Screenshot Review Queue</h1>
        <p class="text-color-secondary text-sm m-0">
          Review and confirm AI-extracted data before adding to your business list.
        </p>
      </div>
      <div class="flex gap-2 flex-wrap align-items-center">
        <Button
          v-if="activeTab === 'pending' && pendingCount > 0"
          :label="`Approve All (${pendingCount})`"
          icon="pi pi-check-circle"
          size="small"
          @click="approveAll"
          :loading="approvingAll"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          rounded
          size="small"
          v-tooltip.left="'Refresh'"
          @click="activeTab === 'pending' ? loadQueue() : loadHistory()"
          :loading="loading || historyLoading"
        />
        <Button
          label="Upload More"
          icon="pi pi-upload"
          size="small"
          outlined
          @click="$router.push('/screenshots/upload')"
        />
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="q-tabs">
      <button
        class="q-tab-btn"
        :class="{ active: activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        Pending
        <span v-if="pendingCount > 0" class="q-tab-badge">{{ pendingCount }}</span>
      </button>
      <button
        class="q-tab-btn"
        :class="{ active: activeTab === 'history' }"
        @click="switchToHistory"
      >
        History
      </button>
    </div>

    <!-- ── PENDING TAB ─────────────────────────────────── -->
    <template v-if="activeTab === 'pending'">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-8 text-color-secondary">
        <i class="pi pi-spin pi-spinner text-3xl mb-3 block"></i>
        Loading queue...
      </div>

      <!-- Empty state -->
      <div v-else-if="queue.length === 0" class="surface-card border-round-xl p-6 text-center">
        <i class="pi pi-check-circle text-5xl text-green-500 mb-3 block"></i>
        <div class="font-semibold text-lg mb-1">Queue is clear!</div>
        <div class="text-color-secondary text-sm mb-4">
          All done. Upload more screenshots to continue.
        </div>
        <Button
          label="Upload Screenshots"
          icon="pi pi-upload"
          @click="$router.push('/screenshots/upload')"
        />
      </div>

      <!-- Queue list -->
      <div v-else class="flex flex-column gap-2">
        <div
          v-for="item in queue"
          :key="item.id"
          class="q-row surface-card border-round-xl"
          :class="{ 'is-active': selectedItem && selectedItem.id === item.id }"
          @click="openItem(item)"
        >
          <!-- Thumbnail -->
          <div class="q-row-thumb">
            <img
              v-if="item.image_filename"
              :src="`/uploads/screenshots/${item.image_filename}`"
              :alt="(edits[item.id] && edits[item.id].extracted_name) || 'Screenshot'"
            />
            <div v-else class="q-thumb-placeholder">
              <i class="pi pi-image text-color-secondary"></i>
            </div>
          </div>

          <!-- Info -->
          <div class="q-row-info flex-1 min-w-0">
            <div
              class="font-semibold text-sm text-overflow-ellipsis overflow-hidden white-space-nowrap"
            >
              {{ (edits[item.id] && edits[item.id].extracted_name) || '(no name extracted)' }}
            </div>
            <div class="flex gap-3 mt-1 flex-wrap">
              <span v-if="edits[item.id] && edits[item.id].extracted_type" class="q-meta">
                <i class="pi pi-tag"></i>
                {{ edits[item.id].extracted_type }}
              </span>
              <span v-if="edits[item.id] && edits[item.id].extracted_phone" class="q-meta">
                <i class="pi pi-phone"></i>
                {{ edits[item.id].extracted_phone }}
              </span>
              <span v-if="edits[item.id] && edits[item.id].extracted_city" class="q-meta">
                <i class="pi pi-map-marker"></i>
                {{ edits[item.id].extracted_city }}
              </span>
            </div>
          </div>

          <!-- Status + chevron -->
          <div class="q-row-end flex align-items-center gap-2 flex-shrink-0">
            <span class="q-status-chip" :class="statusChipClass(item.status)">
              <i :class="statusIcon(item.status)"></i>
              {{ statusShortLabel(item.status) }}
            </span>
            <i class="pi pi-chevron-right text-color-secondary text-xs"></i>
          </div>
        </div>
      </div>
    </template>

    <!-- ── HISTORY TAB ────────────────────────────────── -->
    <template v-else-if="activeTab === 'history'">
      <div v-if="historyLoading" class="text-center py-8 text-color-secondary">
        <i class="pi pi-spin pi-spinner text-3xl mb-3 block"></i>
        Loading history...
      </div>
      <div v-else-if="history.length === 0" class="surface-card border-round-xl p-6 text-center">
        <i class="pi pi-clock text-4xl text-color-secondary mb-3 block"></i>
        <div class="font-semibold text-lg mb-1">No history yet</div>
        <div class="text-color-secondary text-sm">
          Approved and discarded items will appear here.
        </div>
      </div>
      <div v-else class="flex flex-column gap-2">
        <div
          v-for="item in history"
          :key="item.id"
          class="surface-card border-round-xl p-3 flex align-items-center gap-3"
        >
          <span
            class="h-status-dot flex-shrink-0"
            :class="item.status === 'approved' ? 'approved' : 'discarded'"
          ></span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{ item.extracted_name || '(no name)' }}</div>
            <div class="flex gap-3 mt-1 flex-wrap">
              <span v-if="item.extracted_phone" class="q-meta">
                <i class="pi pi-phone"></i>
                {{ item.extracted_phone }}
              </span>
              <span v-if="item.extracted_city" class="q-meta">
                <i class="pi pi-map-marker"></i>
                {{ item.extracted_city }}
              </span>
              <span v-if="item.extracted_type" class="q-meta">
                <i class="pi pi-tag"></i>
                {{ item.extracted_type }}
              </span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span
              class="q-status-chip"
              :class="item.status === 'approved' ? 'approved' : 'discarded'"
            >
              {{ item.status === 'approved' ? 'Approved' : 'Discarded' }}
            </span>
            <div class="text-xs text-color-secondary mt-1">{{ formatDate(item.created_at) }}</div>
            <div v-if="item.uploader_name" class="text-xs text-color-secondary">
              by {{ item.uploader_name }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── EDIT DRAWER ───────────────────────────────── -->
    <Drawer
      v-model:visible="drawerVisible"
      position="right"
      style="width: min(560px, 100vw)"
      @hide="selectedItem = null"
    >
      <template #header>
        <div class="flex align-items-center gap-2 min-w-0">
          <i class="pi pi-pencil text-primary flex-shrink-0"></i>
          <span
            class="font-semibold text-sm overflow-hidden white-space-nowrap text-overflow-ellipsis"
          >
            {{
              (selectedItem && edits[selectedItem.id] && edits[selectedItem.id].extracted_name) ||
              'Review Item'
            }}
          </span>
        </div>
      </template>

      <template v-if="selectedItem">
        <!-- Screenshot preview -->
        <div v-if="selectedItem.image_filename" class="drawer-shot mb-4">
          <img
            :src="`/uploads/screenshots/${selectedItem.image_filename}`"
            alt="Screenshot"
            @click="openPreview(selectedItem)"
          />
          <p class="text-xs text-color-secondary text-center mt-1 mb-0">
            <i class="pi pi-search-plus mr-1"></i>
            Click to enlarge
          </p>
        </div>

        <!-- Status banner -->
        <div
          class="flex align-items-center gap-2 p-3 border-round-xl mb-4 text-sm"
          :class="statusBarClass(selectedItem.status)"
        >
          <i :class="statusIcon(selectedItem.status)"></i>
          {{ statusLabel(selectedItem.status) }}
        </div>

        <!-- Error message -->
        <div
          v-if="selectedItem.status === 'error'"
          class="p-3 border-round-xl bg-red-50 text-red-700 text-sm mb-4 flex gap-2 align-items-start"
        >
          <i class="pi pi-exclamation-triangle flex-shrink-0 mt-1"></i>
          <span>{{ selectedItem.error_message }}</span>
        </div>

        <!-- Form fields -->
        <div class="flex flex-column gap-3">
          <div class="drawer-2col">
            <div class="d-field">
              <label>Business Name *</label>
              <InputText
                v-model="edits[selectedItem.id].extracted_name"
                class="w-full"
                placeholder="Business name"
              />
            </div>
            <div class="d-field">
              <label>Type</label>
              <InputText
                v-model="edits[selectedItem.id].extracted_type"
                class="w-full"
                placeholder="e.g. Restaurant, Salon"
              />
            </div>
          </div>
          <div class="drawer-2col">
            <div class="d-field">
              <label>Phone</label>
              <InputText
                v-model="edits[selectedItem.id].extracted_phone"
                class="w-full"
                placeholder="+94 77 000 0000"
              />
            </div>
            <div class="d-field">
              <label>City</label>
              <InputText
                v-model="edits[selectedItem.id].extracted_city"
                class="w-full"
                placeholder="City / Town"
              />
            </div>
          </div>
          <div class="d-field">
            <label>Address</label>
            <InputText
              v-model="edits[selectedItem.id].extracted_address"
              class="w-full"
              placeholder="Street address"
            />
          </div>
          <div class="drawer-2col">
            <div class="d-field">
              <label>Website</label>
              <InputText
                v-model="edits[selectedItem.id].extracted_website"
                class="w-full"
                placeholder="https://"
              />
            </div>
            <div class="d-field">
              <label>Social Page URL</label>
              <InputText
                v-model="edits[selectedItem.id].extracted_social_url"
                class="w-full"
                placeholder="facebook.com/..."
              />
            </div>
          </div>
          <div class="d-field">
            <label>Notes</label>
            <Textarea
              v-model="edits[selectedItem.id].extracted_notes"
              class="w-full"
              rows="2"
              auto-resize
              placeholder="Any additional details..."
            />
          </div>
        </div>

        <!-- Upload metadata -->
        <p class="text-xs text-color-secondary mt-3 mb-0">
          Uploaded {{ formatDate(selectedItem.created_at) }}
          <span v-if="selectedItem.uploader_name">by {{ selectedItem.uploader_name }}</span>
        </p>
      </template>

      <!-- Drawer footer with action buttons -->
      <template #footer>
        <div v-if="selectedItem" class="flex gap-2 justify-content-between w-full">
          <Button
            label="Discard"
            icon="pi pi-trash"
            severity="danger"
            outlined
            size="small"
            @click="discard(selectedItem)"
            :loading="actionLoading[selectedItem.id] === 'discard'"
          />
          <div class="flex gap-2">
            <Button
              v-if="selectedItem.status === 'error'"
              label="Retry AI"
              icon="pi pi-refresh"
              severity="warning"
              outlined
              size="small"
              @click="retryItem(selectedItem)"
              :loading="actionLoading[selectedItem.id] === 'retry'"
            />
            <Button
              v-if="selectedItem.status === 'pending_review'"
              label="Save & Add Business"
              icon="pi pi-check"
              size="small"
              @click="approve(selectedItem)"
              :loading="actionLoading[selectedItem.id] === 'approve'"
              :disabled="!edits[selectedItem.id] || !edits[selectedItem.id].extracted_name"
            />
          </div>
        </div>
      </template>
    </Drawer>

    <!-- Full image preview dialog -->
    <Dialog
      v-model:visible="previewVisible"
      modal
      :header="(previewItem && previewItem.image_filename) || 'Preview'"
      style="max-width: 90vw; max-height: 90vh"
    >
      <img
        v-if="previewItem"
        :src="`/uploads/screenshots/${previewItem.image_filename}`"
        style="
          max-width: 80vw;
          max-height: 75vh;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        "
        alt="Screenshot preview"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { screenshotApi } from '@/api/screenshots';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';

const toast = useToast();

const loading = ref(false);
const queue = ref([]);
const edits = reactive({});
const actionLoading = reactive({});
const previewVisible = ref(false);
const previewItem = ref(null);

const activeTab = ref('pending');
const historyLoading = ref(false);
const history = ref([]);
const approvingAll = ref(false);

// Drawer state
const drawerVisible = ref(false);
const selectedItem = ref(null);

const pendingCount = computed(
  () => queue.value.filter((i) => i.status === 'pending_review').length,
);

function openItem(item) {
  selectedItem.value = item;
  drawerVisible.value = true;
}

async function loadQueue() {
  loading.value = true;
  try {
    const items = await screenshotApi.getQueue();
    queue.value = items;
    for (const item of items) {
      if (edits[item.id]) continue;
      edits[item.id] = {
        extracted_name: item.extracted_name || '',
        extracted_type: item.extracted_type || '',
        extracted_phone: item.extracted_phone || '',
        extracted_address: item.extracted_address || '',
        extracted_city: item.extracted_city || '',
        extracted_website: item.extracted_website || '',
        extracted_social_url: item.extracted_social_url || '',
        extracted_notes: item.extracted_notes || '',
      };
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to load queue',
      detail: err.message,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
}

async function approve(item) {
  actionLoading[item.id] = 'approve';
  try {
    await screenshotApi.updateQueueItem(item.id, edits[item.id]);
    const result = await screenshotApi.approveQueueItem(item.id);
    toast.add({
      severity: 'success',
      summary: 'Business added!',
      detail: `"${edits[item.id].extracted_name}" has been added (ID #${result.businessId})`,
      life: 4000,
    });
    queue.value = queue.value.filter((q) => q.id !== item.id);
    drawerVisible.value = false;
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to approve',
      detail: err.response?.data?.message || err.message,
      life: 4000,
    });
  } finally {
    delete actionLoading[item.id];
  }
}

async function discard(item) {
  actionLoading[item.id] = 'discard';
  try {
    await screenshotApi.discardQueueItem(item.id);
    toast.add({ severity: 'info', summary: 'Discarded', life: 2500 });
    queue.value = queue.value.filter((q) => q.id !== item.id);
    drawerVisible.value = false;
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Failed to discard', detail: err.message, life: 3000 });
  } finally {
    delete actionLoading[item.id];
  }
}

function openPreview(item) {
  previewItem.value = item;
  previewVisible.value = true;
}

function switchToHistory() {
  activeTab.value = 'history';
  if (history.value.length === 0) loadHistory();
}

async function loadHistory() {
  historyLoading.value = true;
  try {
    history.value = await screenshotApi.getHistory();
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to load history',
      detail: err.message,
      life: 3000,
    });
  } finally {
    historyLoading.value = false;
  }
}

async function approveAll() {
  approvingAll.value = true;
  try {
    const result = await screenshotApi.approveAll();
    const n = result.approved.length;
    const s = result.skipped.length;
    if (n > 0) {
      toast.add({
        severity: 'success',
        summary: `${n} business${n !== 1 ? 'es' : ''} added!`,
        detail: s > 0 ? `${s} skipped (duplicates or errors)` : undefined,
        life: 4000,
      });
    } else {
      toast.add({
        severity: 'warn',
        summary: 'All skipped',
        detail: result.skipped[0]?.reason || 'No items could be approved',
        life: 5000,
      });
    }
    await loadQueue();
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Approve all failed',
      detail: err.message,
      life: 4000,
    });
  } finally {
    approvingAll.value = false;
  }
}

async function retryItem(item) {
  actionLoading[item.id] = 'retry';
  try {
    const result = await screenshotApi.retryQueueItem(item.id);
    const idx = queue.value.findIndex((q) => q.id === item.id);
    if (idx !== -1) {
      queue.value[idx] = { ...queue.value[idx], status: result.status, error_message: null };
      // update selectedItem so the drawer status bar refreshes
      if (selectedItem.value && selectedItem.value.id === item.id) {
        selectedItem.value = queue.value[idx];
      }
      if (result.extracted) {
        edits[item.id] = {
          extracted_name: result.extracted.name || '',
          extracted_type: result.extracted.type || '',
          extracted_phone: result.extracted.phone || '',
          extracted_address: result.extracted.address || '',
          extracted_city: result.extracted.city || '',
          extracted_website: result.extracted.website || '',
          extracted_social_url: result.extracted.social_url || '',
          extracted_notes: result.extracted.notes || '',
        };
      }
    }
    toast.add({
      severity: 'success',
      summary: 'Extraction successful!',
      detail: `"${result.extracted?.name || 'Business'}" ready for review`,
      life: 3000,
    });
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Retry failed',
      detail: err.response?.data?.message || err.message,
      life: 4000,
    });
  } finally {
    delete actionLoading[item.id];
  }
}

// ── Status helpers ──────────────────────────────────────
function statusBarClass(status) {
  const map = {
    processing: 'bg-blue-50 text-blue-700',
    pending_review: 'bg-orange-50 text-orange-700',
    error: 'bg-red-50 text-red-700',
  };
  return map[status] || '';
}

function statusIcon(status) {
  const map = {
    processing: 'pi pi-spin pi-spinner',
    pending_review: 'pi pi-exclamation-circle',
    error: 'pi pi-times-circle',
  };
  return map[status] || 'pi pi-circle';
}

function statusLabel(status) {
  const map = {
    processing: 'Processing with Gemini AI...',
    pending_review: 'Pending Review — check and confirm the extracted data',
    error: 'Extraction Failed',
  };
  return map[status] || status;
}

function statusShortLabel(status) {
  const map = { processing: 'Processing', pending_review: 'Review', error: 'Failed' };
  return map[status] || status;
}

function statusChipClass(status) {
  const map = {
    processing: 'processing',
    pending_review: 'pending',
    error: 'error',
    approved: 'approved',
    discarded: 'discarded',
  };
  return map[status] || '';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => loadQueue());
</script>

<style scoped>
/* ── Tab switcher ─────────────────────────────────── */
.q-tabs {
  display: inline-flex;
  gap: 2px;
  padding: 4px;
  background: var(--surface-100);
  border-radius: 12px;
}
.q-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.4rem 1.1rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}
.q-tab-btn.active {
  background: var(--surface-card);
  color: var(--text-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.q-tab-badge {
  background: var(--p-primary-500);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 9999px;
  padding: 1px 7px;
  line-height: 1.5;
}

/* ── Queue rows ───────────────────────────────────── */
.q-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
}
.q-row:hover {
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.07);
  border-color: var(--p-primary-200, #c7d2fe);
}
.q-row.is-active {
  border-color: var(--p-primary-400, #818cf8);
}

.q-row-thumb {
  width: 52px;
  height: 52px;
  border-radius: 0.6rem;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-100);
}
.q-row-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.q-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.q-row-info {
  overflow: hidden;
}
.q-row-end {
  gap: 0.5rem;
}

.q-meta {
  font-size: 0.72rem;
  color: var(--text-color-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* ── Status chips ─────────────────────────────────── */
.q-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 9999px;
  white-space: nowrap;
}
.q-status-chip.pending {
  background: #fff3e0;
  color: #e65100;
}
.q-status-chip.error {
  background: #fce4ec;
  color: #c62828;
}
.q-status-chip.processing {
  background: #e3f2fd;
  color: #1565c0;
}
.q-status-chip.approved {
  background: #e8f5e9;
  color: #2e7d32;
}
.q-status-chip.discarded {
  background: var(--surface-200);
  color: var(--text-color-secondary);
}

/* ── History dot ──────────────────────────────────── */
.h-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.h-status-dot.approved {
  background: #4caf50;
}
.h-status-dot.discarded {
  background: var(--text-color-secondary);
}

/* ── Drawer screenshot ────────────────────────────── */
.drawer-shot {
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--surface-100);
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--surface-border);
}
.drawer-shot img {
  max-height: 200px;
  max-width: 100%;
  object-fit: contain;
  cursor: zoom-in;
  display: block;
}

/* ── Drawer form ──────────────────────────────────── */
.drawer-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.d-field {
  display: flex;
  flex-direction: column;
}
.d-field label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  margin-bottom: 0.35rem;
}

/* ── Mobile ───────────────────────────────────────── */
@media (max-width: 480px) {
  .drawer-2col {
    grid-template-columns: 1fr;
  }
  .q-row-end .q-status-chip {
    display: none;
  }
}
</style>
