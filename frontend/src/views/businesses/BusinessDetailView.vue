<template>
  <div v-if="business" class="flex flex-column gap-4">
    <!-- Header card -->
    <div class="surface-card p-4 border-round-xl shadow-1">
      <div class="flex align-items-start justify-content-between flex-wrap gap-3">
        <div>
          <div class="flex align-items-center gap-2 mb-1">
            <Button icon="pi pi-arrow-left" text size="small" @click="$router.back()" />
            <h2 class="m-0 text-2xl font-bold flex align-items-center gap-2">
              <span
                style="cursor: pointer; user-select: none"
                :title="nameCopied ? 'Copied!' : 'Click to copy name'"
                @click="copyName"
              >
                {{ business.name }}
              </span>
              <i
                :class="nameCopied ? 'pi pi-check text-green-500' : 'pi pi-copy text-gray-400'"
                style="font-size: 0.9rem"
              ></i>
            </h2>
            <Tag :value="business.status" :severity="statusSeverity(business.status)" />
          </div>
          <div class="flex gap-3 text-sm text-gray-500 flex-wrap">
            <span v-if="business.type">
              <i class="pi pi-tag mr-1"></i>
              {{ business.type }}
            </span>
            <span v-if="business.city">
              <i class="pi pi-map-marker mr-1"></i>
              {{ business.city }}
            </span>
            <a
              v-if="business.google_maps_url"
              :href="business.google_maps_url"
              target="_blank"
              class="text-primary no-underline"
            >
              <i class="pi pi-map mr-1"></i>
              Google Maps
            </a>
          </div>
          <a
            v-if="business.phone"
            :href="`tel:${business.phone}`"
            class="text-base font-semibold text-gray-700 no-underline flex align-items-center gap-2 mt-2"
          >
            <i class="pi pi-phone"></i>
            {{ business.phone }}
          </a>
        </div>
        <div class="flex gap-2">
          <Select
            v-model="business.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            class="w-10rem"
            @change="updateStatus"
          />
        </div>
      </div>
      <div v-if="business.notes" class="text-sm text-gray-600 bg-gray-50 p-3 border-round">
        {{ business.notes }}
      </div>
    </div>

    <!-- Cold Call Log -->
    <div class="surface-card p-4 border-round-xl shadow-1">
      <div class="flex align-items-center justify-content-between mb-3">
        <h3 class="m-0 font-semibold">Cold Call Log</h3>
        <Button
          v-if="canLogCall"
          label="Log Call"
          icon="pi pi-phone"
          size="small"
          @click="callDialog = true"
        />
      </div>

      <div v-if="calls.length === 0" class="text-gray-400 text-sm py-3">No calls logged yet.</div>

      <div v-for="c in calls" :key="c.id" class="p-3 mb-2 border-1 border-gray-200 border-round-lg">
        <div class="flex align-items-center justify-content-between mb-1">
          <div class="flex align-items-center gap-2">
            <Tag :value="c.outcome?.replace('_', ' ')" :severity="outcomeSeverity(c.outcome)" />
            <span class="text-sm text-gray-500">{{ formatDate(c.call_date) }}</span>
            <span class="text-xs text-gray-400">by {{ c.caller_name }}</span>
          </div>
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="removeCall(c.id, id)"
          />
        </div>
        <div v-if="c.notes" class="text-sm text-gray-600">{{ c.notes }}</div>
        <div v-if="c.next_followup" class="text-xs text-orange-500 mt-1">
          <i class="pi pi-calendar mr-1"></i>
          Follow-up: {{ formatDate(c.next_followup) }}
        </div>
      </div>
    </div>

    <!-- Log Call Dialog -->
    <Dialog v-model:visible="callDialog" header="Log a Call" modal style="width: 420px">
      <div class="flex flex-column gap-3 pt-2">
        <div class="flex justify-content-end">
          <Button
            label="Fill Sample Data"
            icon="pi pi-bolt"
            size="small"
            text
            severity="secondary"
            @click="fillSampleCall"
          />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Call Date *</label>
          <Calendar v-model="callForm.call_date" class="w-full" date-format="yy-mm-dd" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Outcome *</label>
          <Select
            v-model="callForm.outcome"
            :options="outcomeOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Notes</label>
          <Textarea v-model="callForm.notes" class="w-full" rows="3" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Next Follow-up Date</label>
          <Calendar
            v-model="callForm.next_followup"
            class="w-full"
            date-format="yy-mm-dd"
            showClear
          />
        </div>
      </div>
      <Message v-if="error" severity="error" :closable="false" class="mt-2">{{ error }}</Message>
      <template #footer>
        <Button label="Cancel" text @click="callDialog = false" />
        <Button label="Save Call" :loading="savingCall" @click="saveCall" />
      </template>
    </Dialog>
  </div>

  <div v-else class="flex align-items-center justify-content-center h-20rem">
    <ProgressSpinner />
  </div>
</template>

<script setup>
import { useBusinesses } from '@/composables/useBusinesses';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const id = route.params.id;
const auth = useAuthStore();

const canLogCall = computed(
  () => auth.isAdmin || (business.value && business.value.assigned_to === auth.user?.id),
);

const {
  current: business,
  calls,
  loading,
  error,
  clearError,
  loadOne,
  updateCurrent,
  loadCalls,
  addCall,
  removeCall,
} = useBusinesses();

const callDialog = ref(false);
const savingCall = ref(false);
const nameCopied = ref(false);

async function copyName() {
  const text = business.value?.name;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers without Clipboard API
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  nameCopied.value = true;
  setTimeout(() => {
    nameCopied.value = false;
  }, 2000);
}
const callForm = ref({ call_date: new Date(), outcome: '', notes: '', next_followup: null });

const statusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Interested', value: 'interested' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Converted', value: 'converted' },
];

const outcomeOptions = [
  { label: 'No Answer', value: 'no_answer' },
  { label: 'Not Interested', value: 'not_interested' },
  { label: 'Callback Requested', value: 'callback' },
  { label: 'Interested', value: 'interested' },
  { label: 'Converted', value: 'converted' },
];

function statusSeverity(s) {
  return {
    new: 'info',
    contacted: 'warning',
    interested: 'success',
    rejected: 'danger',
    converted: 'success',
  }[s];
}
function outcomeSeverity(o) {
  return {
    no_answer: 'secondary',
    not_interested: 'danger',
    callback: 'warning',
    interested: 'success',
    converted: 'success',
  }[o];
}
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
function toDateStr(v) {
  return v instanceof Date ? v.toISOString().slice(0, 10) : v;
}

async function updateStatus() {
  await updateCurrent({ status: business.value.status });
}

function fillSampleCall() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  callForm.value = {
    call_date: new Date(),
    outcome: 'interested',
    notes: 'Spoke to the manager — showed strong interest in a website package. Requested a quote.',
    next_followup: nextWeek,
  };
}

async function saveCall() {
  if (!callForm.value.outcome) return;
  savingCall.value = true;
  clearError();
  try {
    const payload = {
      ...callForm.value,
      call_date: toDateStr(callForm.value.call_date),
      next_followup: toDateStr(callForm.value.next_followup),
    };
    await addCall(id, payload);
    callDialog.value = false;
    callForm.value = { call_date: new Date(), outcome: '', notes: '', next_followup: null };
  } catch {
    // error.value shown inline in dialog
  } finally {
    savingCall.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadOne(id), loadCalls(id)]);
});
</script>
