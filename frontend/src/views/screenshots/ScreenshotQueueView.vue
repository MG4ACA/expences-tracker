<template>
  <div class="flex flex-column gap-4">
    <!-- Header -->
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <div class="text-xl font-bold">Screenshot Review Queue</div>
        <div class="text-sm text-color-secondary mt-1">
          Review and edit AI-extracted data before saving to your business list.
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <Button
          v-if="activeTab === 'pending' && pendingCount > 0"
          :label="`Approve All (${pendingCount})`"
          icon="pi pi-check-circle"
          size="small"
          @click="approveAll"
          :loading="approvingAll"
        />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          size="small"
          @click="activeTab === 'pending' ? loadQueue() : loadHistory()"
          :loading="loading || historyLoading"
        />
        <Button
          label="Upload More"
          icon="pi pi-upload"
          size="small"
          @click="$router.push('/screenshots/upload')"
        />
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="flex gap-1">
      <Button
        label="Pending Review"
        :badge="pendingCount > 0 ? String(pendingCount) : undefined"
        :text="activeTab !== 'pending'"
        :outlined="activeTab === 'pending'"
        size="small"
        @click="activeTab = 'pending'"
      />
      <Button
        label="History"
        :text="activeTab !== 'history'"
        :outlined="activeTab === 'history'"
        size="small"
        @click="switchToHistory"
      />
    </div>

    <!-- Loading -->
    <div v-if="activeTab === 'pending' && loading" class="text-center py-8 text-color-secondary">
      <i class="pi pi-spin pi-spinner text-4xl mb-3 block"></i>
      Loading queue…
    </div>

    <!-- Empty state -->
    <div v-else-if="activeTab === 'pending' && queue.length === 0" class="surface-card border-round-xl p-6 text-center">
      <i class="pi pi-check-circle text-4xl text-green-500 mb-3 block"></i>
      <div class="font-semibold text-lg mb-1">Queue is empty</div>
      <div class="text-color-secondary text-sm mb-4">
        All screenshots have been reviewed. Upload more to keep going!
      </div>
      <Button
        label="Upload Screenshots"
        icon="pi pi-upload"
        @click="$router.push('/screenshots/upload')"
      />
    </div>

    <!-- Queue items -->
    <div v-else-if="activeTab === 'pending'" class="flex flex-column gap-4">
      <div
        v-for="item in queue"
        :key="item.id"
        class="surface-card border-round-xl overflow-hidden shadow-1"
      >
        <!-- Status bar at top -->
        <div
          class="px-4 py-2 text-sm font-medium flex align-items-center gap-2"
          :class="statusBarClass(item.status)"
        >
          <i :class="statusIcon(item.status)"></i>
          {{ statusLabel(item.status) }}
          <span class="text-xs font-normal ml-auto opacity-70">
            Uploaded {{ formatDate(item.created_at) }}
            <span v-if="item.uploader_name">by {{ item.uploader_name }}</span>
          </span>
        </div>

        <div class="flex flex-column md:flex-row">
          <!-- Screenshot preview -->
          <div
            class="p-3 flex align-items-start justify-content-center"
            style="min-width: 180px; max-width: 240px; background: var(--surface-ground)"
          >
            <img
              v-if="item.image_filename"
              :src="`/uploads/screenshots/${item.image_filename}`"
              class="border-round w-full"
              style="max-height: 320px; object-fit: contain; cursor: pointer"
              @click="openPreview(item)"
              alt="Screenshot"
            />
            <div v-else class="text-color-secondary text-sm text-center py-4">
              <i class="pi pi-image text-3xl block mb-2"></i>
              No preview
            </div>
          </div>

          <!-- Extracted fields form -->
          <div class="flex-1 p-4">
            <div v-if="item.status === 'error'" class="text-red-500 text-sm mb-3">
              <i class="pi pi-exclamation-triangle mr-1"></i>
              AI extraction failed: {{ item.error_message }}
            </div>

            <div class="grid formgrid" style="gap: 0.75rem 1rem">
              <!-- Business Name -->
              <div class="col-12 md:col-6">
                <label class="text-xs text-color-secondary block mb-1">Business Name *</label>
                <InputText
                  v-model="edits[item.id].extracted_name"
                  class="w-full"
                  placeholder="Business name"
                />
              </div>

              <!-- Type -->
              <div class="col-12 md:col-6">
                <label class="text-xs text-color-secondary block mb-1">Business Type</label>
                <InputText
                  v-model="edits[item.id].extracted_type"
                  class="w-full"
                  placeholder="e.g. Restaurant, Salon, Retail"
                />
              </div>

              <!-- Phone -->
              <div class="col-12 md:col-6">
                <label class="text-xs text-color-secondary block mb-1">Phone</label>
                <InputText
                  v-model="edits[item.id].extracted_phone"
                  class="w-full"
                  placeholder="+94 77 123 4567"
                />
              </div>

              <!-- City -->
              <div class="col-12 md:col-6">
                <label class="text-xs text-color-secondary block mb-1">City</label>
                <InputText
                  v-model="edits[item.id].extracted_city"
                  class="w-full"
                  placeholder="City / Town"
                />
              </div>

              <!-- Address -->
              <div class="col-12">
                <label class="text-xs text-color-secondary block mb-1">Address</label>
                <InputText
                  v-model="edits[item.id].extracted_address"
                  class="w-full"
                  placeholder="Street address"
                />
              </div>

              <!-- Website -->
              <div class="col-12 md:col-6">
                <label class="text-xs text-color-secondary block mb-1">Website</label>
                <InputText
                  v-model="edits[item.id].extracted_website"
                  class="w-full"
                  placeholder="https://example.com"
                />
              </div>

              <!-- Social URL -->
              <div class="col-12 md:col-6">
                <label class="text-xs text-color-secondary block mb-1">
                  <i class="pi pi-facebook mr-1"></i>
                  /
                  <i class="pi pi-tiktok mr-1"></i>
                  Social Page URL
                </label>
                <InputText
                  v-model="edits[item.id].extracted_social_url"
                  class="w-full"
                  placeholder="facebook.com/page or @handle"
                />
              </div>

              <!-- Notes -->
              <div class="col-12">
                <label class="text-xs text-color-secondary block mb-1">Notes</label>
                <Textarea
                  v-model="edits[item.id].extracted_notes"
                  class="w-full"
                  rows="2"
                  auto-resize
                  placeholder="Any details about this business…"
                />
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2 mt-4 justify-content-end flex-wrap">
              <Button
                label="Discard"
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                @click="discard(item)"
                :loading="actionLoading[item.id] === 'discard'"
              />
              <Button
                v-if="item.status === 'error'"
                label="Retry"
                icon="pi pi-refresh"
                severity="warning"
                outlined
                size="small"
                @click="retryItem(item)"
                :loading="actionLoading[item.id] === 'retry'"
              />
              <Button
                v-if="item.status === 'pending_review'"
                label="Save &amp; Add to Businesses"
                icon="pi pi-check"
                size="small"
                @click="approve(item)"
                :loading="actionLoading[item.id] === 'approve'"
                :disabled="!edits[item.id].extracted_name"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- History tab -->
    <template v-else-if="activeTab === 'history'">
      <div v-if="historyLoading" class="text-center py-8 text-color-secondary">
        <i class="pi pi-spin pi-spinner text-4xl mb-3 block"></i>
        Loading history…
      </div>
      <div v-else-if="history.length === 0" class="surface-card border-round-xl p-6 text-center">
        <i class="pi pi-clock text-4xl text-color-secondary mb-3 block"></i>
        <div class="font-semibold text-lg mb-1">No history yet</div>
        <div class="text-color-secondary text-sm">Approved and discarded items will appear here.</div>
      </div>
      <div v-else class="flex flex-column gap-2">
        <div
          v-for="item in history"
          :key="item.id"
          class="surface-card border-round-xl p-3 flex align-items-center gap-3"
        >
          <i
            :class="item.status === 'approved'
              ? 'pi pi-check-circle text-green-500 text-xl'
              : 'pi pi-times-circle text-red-400 text-xl'"
          ></i>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{ item.extracted_name || '(no name)' }}</div>
            <div class="text-xs text-color-secondary mt-1 flex gap-3 flex-wrap">
              <span v-if="item.extracted_phone"><i class="pi pi-phone mr-1"></i>{{ item.extracted_phone }}</span>
              <span v-if="item.extracted_city"><i class="pi pi-map-marker mr-1"></i>{{ item.extracted_city }}</span>
              <span v-if="item.extracted_type"><i class="pi pi-tag mr-1"></i>{{ item.extracted_type }}</span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span
              class="text-xs font-medium px-2 py-1 border-round"
              :class="item.status === 'approved' ? 'bg-green-100 text-green-700' : 'surface-200 text-color-secondary'"
            >
              {{ item.status === 'approved' ? 'Approved' : 'Discarded' }}
            </span>
            <div class="text-xs text-color-secondary mt-1">{{ formatDate(item.created_at) }}</div>
            <div v-if="item.uploader_name" class="text-xs text-color-secondary">by {{ item.uploader_name }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Image full preview dialog -->
    <Dialog
      v-model:visible="previewVisible"
      modal
      :header="previewItem?.image_filename"
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
      />
    </Dialog>
  </div>
</template>

<script setup>
import { screenshotApi } from '@/api/screenshots';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
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

const pendingCount = computed(
  () => queue.value.filter((i) => i.status === 'pending_review').length,
);

async function loadQueue() {
  loading.value = true;
  try {
    const items = await screenshotApi.getQueue();
    queue.value = items;
    // Initialise editable copies only for items not already being edited
    // (avoids wiping unsaved changes when the user clicks Refresh)
    for (const item of items) {
      if (edits[item.id]) continue; // preserve any in-progress edits
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
    // Save any edits first
    await screenshotApi.updateQueueItem(item.id, edits[item.id]);
    // Then approve
    const result = await screenshotApi.approveQueueItem(item.id);
    toast.add({
      severity: 'success',
      summary: 'Business added!',
      detail: `"${edits[item.id].extracted_name}" has been added to your business list (ID #${result.businessId})`,
      life: 4000,
    });
    // Remove from local queue
    queue.value = queue.value.filter((q) => q.id !== item.id);
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
    toast.add({ severity: 'error', summary: 'Failed to load history', detail: err.message, life: 3000 });
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
    toast.add({ severity: 'error', summary: 'Approve all failed', detail: err.message, life: 4000 });
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
    processing: 'Processing with Gemini AI…',
    pending_review: 'Pending Review — check and confirm the extracted data',
    error: 'Extraction Failed',
  };
  return map[status] || status;
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
