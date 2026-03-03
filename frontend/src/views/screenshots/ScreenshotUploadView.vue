<template>
  <div class="flex flex-column gap-4">
    <!-- Header -->
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <div class="text-xl font-bold">Import from Screenshots</div>
        <div class="text-sm text-color-secondary mt-1">
          Upload Facebook or TikTok business profile screenshots. Gemini AI will extract the details
          for you to review before saving.
        </div>
      </div>
      <Button
        label="View Review Queue"
        icon="pi pi-list"
        severity="secondary"
        @click="$router.push('/screenshots/queue')"
      />
    </div>

    <!-- Drop zone -->
    <div
      class="surface-card border-round-xl p-5 text-center cursor-pointer transition-all"
      :class="[
        'border-2',
        isDragging ? 'border-primary' : 'border-dashed',
        isDragging ? 'surface-100' : '',
      ]"
      style="border-color: var(--surface-border)"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput.click()"
    >
      <i class="pi pi-image text-5xl text-primary mb-3 block"></i>
      <div class="font-semibold text-lg mb-1">Drag &amp; drop screenshots here</div>
      <div class="text-color-secondary text-sm mb-3">
        or click to browse — JPG, PNG, WebP (max 10 MB each)
      </div>
      <Button label="Choose Files" icon="pi pi-upload" size="small" outlined />
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        style="display: none"
        @change="onFileSelect"
      />
    </div>

    <!-- Selected files list -->
    <div v-if="selectedFiles.length > 0" class="surface-card border-round-xl p-4">
      <div class="flex align-items-center justify-content-between mb-3">
        <span class="font-semibold">{{ selectedFiles.length }} file(s) selected</span>
        <Button
          label="Clear All"
          icon="pi pi-times"
          text
          severity="secondary"
          size="small"
          @click="clearFiles"
          :disabled="uploading"
        />
      </div>

      <div class="flex flex-column gap-2">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex align-items-center gap-3 p-2 border-round surface-100"
        >
          <!-- Thumbnail -->
          <img
            :src="previewUrls[index]"
            class="border-round"
            style="width: 48px; height: 48px; object-fit: cover; flex-shrink: 0"
          />
          <div class="flex-1 min-w-0">
            <div
              class="text-sm font-medium text-overflow-ellipsis overflow-hidden white-space-nowrap"
            >
              {{ file.name }}
            </div>
            <div class="text-xs text-color-secondary">{{ formatSize(file.size) }}</div>
          </div>
          <Button
            icon="pi pi-times"
            text
            rounded
            severity="secondary"
            size="small"
            @click="removeFile(index)"
            :disabled="uploading"
          />
        </div>
      </div>

      <!-- Upload progress -->
      <div v-if="uploading" class="mt-3">
        <div class="flex align-items-center justify-content-between mb-1">
          <span class="text-sm">
            <span v-if="uploadPhase === 'uploading'">Uploading files…</span>
            <span v-else>
              Processing with Gemini AI ({{ selectedFiles.length }} image{{
                selectedFiles.length !== 1 ? 's' : ''
              }})…
            </span>
          </span>
          <span class="text-sm font-medium">{{ uploadProgress }}%</span>
        </div>
        <ProgressBar :value="uploadProgress" style="height: 8px" />
        <div class="text-xs text-color-secondary mt-1">
          <span v-if="uploadPhase === 'processing'">
            Gemini is extracting business data — ~5–15 s per screenshot. Please keep this page open.
          </span>
          <span v-else>Transferring files to server…</span>
        </div>
      </div>

      <!-- Upload button -->
      <div v-if="!uploading" class="flex justify-content-end mt-3">
        <Button
          :label="`Process ${selectedFiles.length} Screenshot(s)`"
          icon="pi pi-sparkles"
          @click="uploadAll"
        />
      </div>
    </div>

    <!-- Results summary after upload -->
    <div v-if="uploadResults.length > 0" class="surface-card border-round-xl p-4">
      <div class="font-semibold mb-3 flex align-items-center gap-2">
        <i class="pi pi-check-circle text-green-500"></i>
        Processing Complete
      </div>
      <div class="flex flex-column gap-2 mb-4">
        <div
          v-for="result in uploadResults"
          :key="result.id"
          class="flex align-items-center gap-2 text-sm"
        >
          <i
            :class="
              result.status === 'pending_review'
                ? 'pi pi-check text-green-500'
                : 'pi pi-exclamation-triangle text-orange-400'
            "
          ></i>
          <span v-if="result.status === 'pending_review'">
            <b>{{ result.extracted?.name || 'Unknown' }}</b>
            — ready to review
          </span>
          <span v-else class="text-color-secondary">Failed to extract: {{ result.error }}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <Button
          label="Go to Review Queue"
          icon="pi pi-list"
          @click="$router.push('/screenshots/queue')"
        />
        <Button
          label="Upload More"
          icon="pi pi-plus"
          severity="secondary"
          outlined
          @click="resetAll"
        />
      </div>
    </div>

    <!-- Tips card -->
    <div
      v-if="selectedFiles.length === 0 && uploadResults.length === 0"
      class="surface-card border-round-xl p-4"
    >
      <div class="font-semibold mb-2 flex align-items-center gap-2">
        <i class="pi pi-info-circle text-primary"></i>
        Tips for best results
      </div>
      <ul class="text-sm text-color-secondary pl-3 m-0 flex flex-column gap-1">
        <li>Make sure the screenshot shows the page name clearly at the top</li>
        <li>Phone numbers visible as plain text work best</li>
        <li>Include the "About" section or bio in the screenshot if possible</li>
        <li>Works with both Facebook and TikTok profiles</li>
        <li>Up to 20 screenshots can be uploaded at once</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { screenshotApi } from '@/api/screenshots';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const toast = useToast();

const fileInput = ref(null);
const isDragging = ref(false);
const selectedFiles = ref([]);
const previewUrls = ref([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadPhase = ref(''); // 'uploading' | 'processing' | ''
const uploadResults = ref([]);
let progressTimer = null;

function onDrop(event) {
  isDragging.value = false;
  addFiles(Array.from(event.dataTransfer.files));
}

function onFileSelect(event) {
  addFiles(Array.from(event.target.files));
  event.target.value = '';
}

function addFiles(files) {
  const imageFiles = files.filter((f) => f.type.startsWith('image/'));
  if (imageFiles.length !== files.length) {
    toast.add({ severity: 'warn', summary: 'Non-image files skipped', life: 3000 });
  }

  const MAX = 20;
  const remaining = MAX - selectedFiles.value.length;
  if (remaining <= 0) {
    toast.add({
      severity: 'warn',
      summary: 'Limit reached',
      detail: 'Maximum 20 screenshots at once',
      life: 3000,
    });
    return;
  }
  const toAdd = imageFiles.slice(0, remaining);
  if (toAdd.length < imageFiles.length) {
    toast.add({
      severity: 'warn',
      summary: 'Some files skipped',
      detail: `Only ${toAdd.length} file(s) added — 20 screenshot limit reached`,
      life: 3500,
    });
  }
  for (const file of toAdd) {
    selectedFiles.value.push(file);
    previewUrls.value.push(URL.createObjectURL(file));
  }
}

function removeFile(index) {
  URL.revokeObjectURL(previewUrls.value[index]);
  selectedFiles.value.splice(index, 1);
  previewUrls.value.splice(index, 1);
}

function clearFiles() {
  previewUrls.value.forEach((url) => URL.revokeObjectURL(url));
  selectedFiles.value = [];
  previewUrls.value = [];
}

function resetAll() {
  clearFiles();
  uploadResults.value = [];
  uploadProgress.value = 0;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadAll() {
  if (selectedFiles.value.length === 0) return;
  uploading.value = true;
  uploadProgress.value = 0;
  uploadPhase.value = 'uploading';

  try {
    const response = await screenshotApi.upload(selectedFiles.value, (event) => {
      if (event.total) {
        const pct = Math.round((event.loaded / event.total) * 60);
        uploadProgress.value = pct;
        if (pct >= 60 && uploadPhase.value === 'uploading') {
          // Transfer done — Gemini is now processing server-side
          uploadPhase.value = 'processing';
          // Slowly tick from 60 → 95 to show activity during server processing
          progressTimer = setInterval(() => {
            if (uploadProgress.value < 95) uploadProgress.value += 1;
            else clearInterval(progressTimer);
          }, 1500);
        }
      }
    });

    clearInterval(progressTimer);
    uploadProgress.value = 100;
    uploadPhase.value = '';
    uploadResults.value = response.data.results;

    const successCount = uploadResults.value.filter((r) => r.status === 'pending_review').length;
    const errorCount = uploadResults.value.filter((r) => r.status === 'error').length;

    if (successCount > 0) {
      toast.add({
        severity: 'success',
        summary: 'Processing complete',
        detail: `${successCount} screenshot(s) ready for review${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        life: 4000,
      });
    } else {
      // Show the actual error from the first failed result instead of a generic message
      const firstError = uploadResults.value.find((r) => r.status === 'error');
      toast.add({
        severity: 'error',
        summary: 'All screenshots failed',
        detail: firstError?.error || 'Extraction failed — check server logs for details',
        life: 6000,
      });
    }
  } catch (err) {
    clearInterval(progressTimer);
    uploadPhase.value = '';
    toast.add({
      severity: 'error',
      summary: 'Upload failed',
      detail: err.response?.data?.message || err.message,
      life: 5000,
    });
  } finally {
    uploading.value = false;
  }
}
</script>
