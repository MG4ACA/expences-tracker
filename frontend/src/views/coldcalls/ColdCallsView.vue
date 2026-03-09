<template>
  <div class="flex flex-column gap-4">
    <!-- Toolbar -->
    <div class="flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="flex gap-2 flex-wrap">
        <span class="p-input-icon-left">
          <InputText v-model="search" placeholder="Search business…" class="w-14rem" />
        </span>
        <Select
          v-model="outcomeFilter"
          :options="outcomeOptions"
          option-label="label"
          option-value="value"
          placeholder="All Outcomes"
          show-clear
          class="w-12rem"
        />
        <Select
          v-model="dateFilter"
          :options="dateRangeOptions"
          option-label="label"
          option-value="value"
          class="w-10rem"
        />
      </div>
      <div class="text-sm text-gray-400">{{ filteredCalls.length }} record(s)</div>
    </div>

    <!-- Desktop: Table View -->
    <div class="surface-card border-round-xl shadow-1 overflow-hidden hidden md:block">
      <DataTable
        :value="filteredCalls"
        :loading="loading"
        striped-rows
        paginator
        :rows="20"
        :rows-per-page-options="[10, 20, 50]"
        responsive-layout="scroll"
        sort-field="call_date"
        :sort-order="-1"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center py-6 text-gray-400">
            <i class="pi pi-phone text-4xl mb-3 block"></i>
            No call logs found.
          </div>
        </template>

        <Column field="business_name" header="Business" sortable style="min-width: 160px">
          <template #body="{ data }">
            <RouterLink
              :to="`/businesses/${data.business_id}`"
              class="text-primary font-medium no-underline hover:underline"
            >
              {{ data.business_name }}
            </RouterLink>
          </template>
        </Column>

        <Column field="call_date" header="Call Date" sortable style="min-width: 120px">
          <template #body="{ data }">{{ formatDate(data.call_date) }}</template>
        </Column>

        <Column field="outcome" header="Outcome" sortable style="min-width: 130px">
          <template #body="{ data }">
            <Tag
              :value="data.outcome?.replace('_', ' ')"
              :severity="outcomeSeverity(data.outcome)"
            />
          </template>
        </Column>

        <Column field="notes" header="Notes" style="min-width: 200px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ data.notes || '—' }}</span>
          </template>
        </Column>

        <Column field="next_followup" header="Follow-up" sortable style="min-width: 120px">
          <template #body="{ data }">
            <span
              v-if="data.next_followup"
              class="text-xs"
              :class="isOverdue(data.next_followup) ? 'text-red-500' : 'text-orange-500'"
            >
              <i class="pi pi-calendar mr-1"></i>
              {{ formatDate(data.next_followup) }}
              <span v-if="isOverdue(data.next_followup)">· Overdue</span>
            </span>
            <span v-else class="text-gray-300">—</span>
          </template>
        </Column>

        <Column field="caller_name" header="Logged By" sortable style="min-width: 120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-500">{{ data.caller_name || '—' }}</span>
          </template>
        </Column>

        <Column style="width: 60px; text-align: center">
          <template #body="{ data }">
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              v-tooltip.top="'Delete call'"
              @click="confirmDelete(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Mobile: Card View -->
    <div class="flex flex-column gap-2 md:hidden">
      <div v-if="loading" class="text-center py-6 text-gray-400">
        <i class="pi pi-spin pi-spinner text-4xl mb-3 block"></i>
        Loading…
      </div>
      <div v-else-if="filteredCalls.length === 0" class="text-center py-6 text-gray-400">
        <i class="pi pi-phone text-4xl mb-3 block"></i>
        No call logs found.
      </div>
      <div
        v-for="call in filteredCalls"
        :key="call.id"
        class="surface-card p-2 border-round-lg shadow-1"
      >
        <!-- Business Name + Outcome -->
        <div class="flex align-items-center justify-content-between gap-1">
          <RouterLink
            :to="`/businesses/${call.business_id}`"
            class="text-primary font-semibold no-underline text-sm flex-1 min-w-0 truncate"
          >
            <p>
              {{ call.business_name }}
            </p>
          </RouterLink>
          <Tag
            :value="call.outcome?.replace('_', ' ')"
            :severity="outcomeSeverity(call.outcome)"
            style="font-size: 0.65rem; padding: 1px 4px; flex-shrink: 0"
          />
        </div>

        <!-- Call Date, Follow-up and Logged By -->
        <div class="flex align-items-center justify-content-between text-xs gap-1">
          <div class="flex align-items-center gap-1 text-gray-500">
            <i class="pi pi-calendar" style="font-size: 0.5rem"></i>
            {{ formatDate(call.call_date) }}
          </div>
          <div
            v-if="call.next_followup"
            :class="isOverdue(call.next_followup) ? 'text-red-500' : 'text-orange-500'"
            class="flex align-items-center gap-1"
          >
            <i class="pi pi-calendar-clock" style="font-size: 0.5rem"></i>
            {{ formatDate(call.next_followup) }}
          </div>
          <div v-else class="text-gray-400 text-xs">—</div>
          <div class="text-gray-500 text-xs" style="font-size: 0.7rem">
            {{ call.caller_name || '—' }}
          </div>
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="confirmDelete(call)"
            style="padding: 0; width: 24px; height: 24px"
          />
        </div>

        <!-- Notes -->
        <div v-if="call.notes" class="text-xs text-gray-600 mt-1 line-clamp-1">
          {{ call.notes }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { businessApi } from '@/api/businesses';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const confirm = useConfirm();
const toast = useToast();

const allCalls = ref([]);
const loading = ref(false);
const search = ref('');
const outcomeFilter = ref(null);
const dateFilter = ref('today');

const outcomeOptions = [
  { label: 'No Answer', value: 'no_answer' },
  { label: 'Not Interested', value: 'not_interested' },
  { label: 'Callback Requested', value: 'callback' },
  { label: 'Interested', value: 'interested' },
  { label: 'Converted', value: 'converted' },
];

const dateRangeOptions = [
  { label: 'Today & Overdue', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Dates', value: 'all' },
];

function matchesDateFilter(call, range) {
  if (range === 'all') return true;

  const dateVal = call.next_followup;
  if (!dateVal) return false;

  const today = new Date(new Date().toDateString());
  const date = new Date(new Date(dateVal).toDateString());

  if (range === 'today') {
    return date <= today;
  } else if (range === 'week') {
    const day = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return date >= startOfWeek && date <= endOfWeek;
  } else if (range === 'month') {
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  return true;
}

const filteredCalls = computed(() => {
  let list = allCalls.value;
  if (outcomeFilter.value) list = list.filter((c) => c.outcome === outcomeFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((c) => c.business_name?.toLowerCase().includes(q));
  }
  if (dateFilter.value !== 'all') {
    list = list.filter((c) => matchesDateFilter(c, dateFilter.value));
  }
  return list;
});

function outcomeSeverity(outcome) {
  const map = {
    no_answer: 'secondary',
    not_interested: 'danger',
    callback: 'warning',
    interested: 'info',
    converted: 'success',
  };
  return map[outcome] ?? 'secondary';
}

function formatDate(val) {
  if (!val) return '';
  return new Date(val).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dateVal) {
  if (!dateVal) return false;
  return new Date(dateVal) < new Date(new Date().toDateString());
}

async function loadCalls() {
  loading.value = true;
  try {
    allCalls.value = await businessApi.getAllCalls();
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load call logs',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}

function confirmDelete(callItem) {
  confirm.require({
    message: `Delete this call log for "${callItem.business_name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteCall(callItem.id),
  });
}

async function deleteCall(id) {
  try {
    await businessApi.deleteCall(id);
    allCalls.value = allCalls.value.filter((c) => c.id !== id);
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Call log removed', life: 3000 });
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete call log',
      life: 3000,
    });
  }
}

onMounted(loadCalls);
</script>
