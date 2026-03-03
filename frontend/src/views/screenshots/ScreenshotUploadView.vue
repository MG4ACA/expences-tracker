<template>
  <div class="upload-view flex flex-column gap-5">
    <!-- Header -->
    <div class="flex align-items-start justify-content-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold m-0 mb-1">Import from Screenshots</h1>
        <p class="text-color-secondary text-sm m-0">
          Upload Facebook or TikTok business profile screenshots — Gemini AI extracts the details
          for you to review.
        </p>
      </div>
      <Button
        label="Review Queue"
        icon="pi pi-list"
        severity="secondary"
        outlined
        size="small"
        @click="$router.push('/screenshots/queue')"
      />
    </div>

    <!-- Drop zone -->
    <div
      class="drop-zone border-round-2xl text-center"
      :class="{ 'is-dragging': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="!uploading && fileInput.click()"
      style="cursor: pointer"
    >
      <div class="py-6 px-4">
        <div class="drop-zone-icon mb-3">
          <i class="pi pi-cloud-upload"></i>
        </div>
        <div class="font-semibold text-lg mb-1">
          {{ isDragging ? 'Release to add files' : 'Drag & drop screenshots here' }}
        </div>
        <p class="text-color-secondary text-sm mb-4 m-0">
          JPG, PNG, WebP &middot; max&nbsp;10&nbsp;MB each &middot; up to 20 files
        </p>
        <Button
          label="Choose Files"
          icon="pi pi-folder-open"
          outlined
          size="small"
          @click.stop="fileInput.click()"
        />
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="onFileSelect"
      />
    </div>

    <!-- File grid + actions -->
    <div v-if="selectedFiles.length > 0" class="surface-card border-round-xl p-4">
      <div class="flex align-items-center justify-content-between mb-3">
        <span class="font-semibold text-sm flex align-items-center gap-2">
          <i class="pi pi-images text-primary"></i>
          {{ selectedFiles.length }} file{{ selectedFiles.length !== 1 ? 's' : '' }} selected
        </span>
        <Button
          label="Clear all"
          icon="pi pi-trash"
          text
          severity="secondary"
          size="small"
          @click="clearFiles"
          :disabled="uploading"
        />
      </div>

      <!-- Thumbnail grid -->
      <div class="file-thumb-grid">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="file-thumb-cell"
        >
          <img :src="previewUrls[index]" :alt="file.name" />
          <div class="file-thumb-overlay" v-if="!uploading">
            <button class="thumb-remove-btn" @click.stop="removeFile(index)" title="Remove">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="file-thumb-label">{{ truncateName(file.name) }}</div>
        </div>
      </div>

      <!-- Upload progress -->
      <div v-if="uploading" class="mt-4 p-3 border-round-xl surface-100">
        <div class="flex align-items-center gap-2 mb-2">
          <i class="pi pi-spin pi-spinner text-primary"></i>
          <span class="text-sm font-medium flex-1">
            <span v-if="uploadPhase === 'uploading'">Uploading files...</span>
            <span v-else>
              Gemini AI is extracting data ({{ selectedFiles.length }}
              image{{ selectedFiles.length !== 1 ? 's' : '' }})...
            </span>
          </span>
          <span class="text-sm font-bold text-primary">{{ uploadProgress }}%</span>
        </div>
        <ProgressBar :value="uploadProgress" />
        <p class="text-xs text-color-secondary mt-2 mb-0">
          <span v-if="uploadPhase === 'processing'">
            This may take 5-15 seconds per image. Keep this page open.
          </span>
          <span v-else>Transferring files to server...</span>
        </p>
      </div>

      <!-- CTA -->
      <div v-if="!uploading" class="flex justify-content-end mt-4">
        <Button
          :label="`Process ${selectedFiles.length} Screenshot${selectedFiles.length !== 1 ? 's' : ''}`"
          icon="pi pi-sparkles"
          @click="uploadAll"
        />
      </div>
    </div>

    <!-- Results summary -->
    <div v-if="uploadResults.length > 0" class="surface-card border-round-xl p-4">
      <div class="flex align-items-center gap-2 mb-3 font-semibold">
        <i class="pi pi-check-circle text-green-500 text-lg"></i>
        Processing complete
      </div>
      <div class="flex flex-column gap-2 mb-4">
        <div
          v-for="result in uploadResults"
          :key="result.id"
          class="flex align-items-center gap-2 text-sm p-2 border-round surface-100"
        >
          <span
            class="result-icon-circle flex-shrink-0"
            :class="
              result.status === 'pending_review'
                ? 'success'
                : result.status === 'duplicate'
                  ? 'info'
                  : 'warn'
            "
          >
            <i
              :class="
                result.status === 'pending_review'
                  ? 'pi pi-check'
                  : result.status === 'duplicate'
                    ? 'pi pi-copy'
                    : 'pi pi-exclamation-triangle'
              "
            ></i>
          </span>
          <span v-if="result.status === 'pending_review'">
            <b>{{ result.extracted?.name || 'Unknown' }}</b> ready to review
          </span>
          <span v-else-if="result.status === 'duplicate'" class="text-blue-700">
            Duplicate {{ result.error }}
          </span>
          <span v-else class="text-color-secondary">Failed: {{ result.error }}</span>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
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
      <div class="font-semibold text-sm mb-2 flex align-items-center gap-2">
        <i class="pi pi-lightbulb text-primary"></i>
        Tips for best results
      </div>
      <ul class="text-sm text-color-secondary m-0 pl-4 flex flex-column gap-1">
        <li>Make sure the screenshot shows the page name clearly at the top</li>
        <li>Phone numbers as plain text are extracted most accurately</li>
        <li>Include the About section or bio if possible</li>
        <li>Works with Facebook and TikTok business profiles</li>
        <li>Up to 20 screenshots per upload</li>
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
const uploadPhase = ref('');
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
    toast.add({ severity: 'warn', summary: 'Limit reached', detail: 'Maximum 20 screenshots at once', life: 3000 });
    return;
  }
  const toAdd = imageFiles.slice(0, remaining);
  if (toAdd.length < imageFiles.length) {
    toast.add({ severity: 'warn', summary: 'Some files skipped', detail: `Only ${toAdd.length} file(s) added`, life: 3500 });
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

function truncateName(name) {
  return name.length > 20 ? name.slice(0, 17) + '...' : name;
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
          uploadPhase.value = 'processing';
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
    const dupCount = uploadResults.value.filter((r) => r.status === 'duplicate').length;
    if (successCount > 0) {
      const parts = [`${successCount} ready for review`];
      if (dupCount > 0) parts.push(`${dupCount} duplicate${dupCount !== 1 ? 's' : ''} skipped`);
      if (errorCount > 0) parts.push(`${errorCount} failed`);
      toast.add({ severity: 'success', summary: 'Processing complete', detail: parts.join(', '), life: 4000 });
    } else if (dupCount > 0 && errorCount === 0) {
      toast.add({ severity: 'info', summary: 'All duplicates', detail: `${dupCount} image${dupCount !== 1 ? 's were' : ' was'} already in the queue`, life: 5000 });
    } else {
      const firstError = uploadResults.value.find((r) => r.status === 'error');
      toast.add({ severity: 'error', summary: 'All screenshots failed', detail: firstError?.error || 'Extraction failed', life: 6000 });
    }
  } catch (err) {
    clearInterval(progressTimer);
    uploadPhase.value = '';
    toast.add({ severity: 'error', summary: 'Upload failed', detail: err.response?.data?.message || err.message, life: 5000 });
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed var(--p-content-border-color, var(--surface-border));
  background: var(--surface-card);
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}
.drop-zone:hover {
  border-color: var(--p-primary-400);
}
.drop-zone.is-dragging {
  border-color: var(--p-primary-500);
  border-style: solid;
  background: color-mix(in srgb, var(--p-primary-50, #eef2ff) 50%, var(--surface-card));
  transform: scale(1.008);
}
.drop-zone-icon {
  color: var(--p-primary-400);
  font-size: 3rem;
  transition: transform 0.2s;
}
.drop-zone.is-dragging .drop-zone-icon {
  transform: translateY(-6px) scale(1.1);
}
.file-thumb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.75rem;
}
.file-thumb-cell {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--surface-100);
  aspect-ratio: 1;
}
.file-thumb-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}
.file-thumb-cell:hover img {
  transform: scale(1.04);
}
.file-thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 0.15s;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 5px;
}
.file-thumb-cell:hover .file-thumb-overlay {
  opacity: 1;
}
.thumb-remove-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  transition: background 0.15s;
  line-height: 1;
}
.thumb-remove-btn:hover {
  background: #fff;
}
.file-thumb-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.52);
  color: #fff;
  padding: 3px 6px;
  font-size: 0.65rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.result-icon-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  flex-shrink: 0;
}
.result-icon-circle.success { background: #dcfce7; color: #16a34a; }
.result-icon-circle.info    { background: #dbeafe; color: #2563eb; }
.result-icon-circle.warn    { background: #fff7ed; color: #ea580c; }
@media (max-width: 480px) {
  .file-thumb-grid {
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 0.5rem;
  }
}
</style>
