<template>
  <div class="flex flex-column gap-4">
    <!-- ── Date picker toolbar ─────────────────────────────────────── -->
    <div class="flex align-items-center gap-3 flex-wrap">
      <Button
        icon="pi pi-chevron-left"
        text
        rounded
        size="small"
        v-tooltip.top="'Previous day'"
        @click="shiftDate(-1)"
      />
      <DatePicker
        v-model="selectedDate"
        date-format="yy-mm-dd"
        :max-date="new Date()"
        show-icon
        class="w-12rem"
        @date-select="onDateSelect"
      />
      <Button
        icon="pi pi-chevron-right"
        text
        rounded
        size="small"
        v-tooltip.top="'Next day'"
        :disabled="isToday"
        @click="shiftDate(1)"
      />
      <Button label="Today" size="small" outlined :disabled="isToday" @click="goToday" />
      <span class="text-sm text-gray-400 ml-auto">
        {{ formattedDate }}
      </span>
    </div>

    <!-- ── Loading skeleton ──────────────────────────────────────────── -->
    <div v-if="loading" class="grid">
      <div v-for="n in 4" :key="n" class="col-6 lg:col-3">
        <Skeleton height="80px" border-radius="12px" />
      </div>
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────── -->
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else-if="data">
      <!-- ── Summary cards ──────────────────────────────────────────── -->
      <div class="grid">
        <!-- Businesses -->
        <div class="col-6 lg:col-3">
          <div
            class="surface-card p-3 border-round-xl shadow-1 cursor-pointer summary-card"
            :class="{ 'card-active': expanded === 'businesses' }"
            @click="toggle('businesses')"
          >
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="text-gray-500 text-xs font-medium">Businesses Added</span>
              <span class="bg-blue-100 text-blue-600 border-round p-1">
                <i class="pi pi-building text-sm"></i>
              </span>
            </div>
            <div class="text-2xl font-bold">{{ data.businesses.count }}</div>
            <div class="text-xs text-gray-400 mt-1">
              {{ data.businesses.count === 1 ? 'business' : 'businesses' }} logged
            </div>
          </div>
        </div>

        <!-- Tasks Added -->
        <div class="col-6 lg:col-3">
          <div
            class="surface-card p-3 border-round-xl shadow-1 cursor-pointer summary-card"
            :class="{ 'card-active': expanded === 'todosAdded' }"
            @click="toggle('todosAdded')"
          >
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="text-gray-500 text-xs font-medium">Tasks Added</span>
              <span class="bg-orange-100 text-orange-600 border-round p-1">
                <i class="pi pi-plus-circle text-sm"></i>
              </span>
            </div>
            <div class="text-2xl font-bold">{{ data.todosAdded.count }}</div>
            <div class="text-xs text-gray-400 mt-1">created today</div>
          </div>
        </div>

        <!-- Tasks Completed -->
        <div class="col-6 lg:col-3">
          <div
            class="surface-card p-3 border-round-xl shadow-1 cursor-pointer summary-card"
            :class="{ 'card-active': expanded === 'todosCompleted' }"
            @click="toggle('todosCompleted')"
          >
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="text-gray-500 text-xs font-medium">Tasks Completed</span>
              <span class="bg-green-100 text-green-600 border-round p-1">
                <i class="pi pi-check-circle text-sm"></i>
              </span>
            </div>
            <div class="text-2xl font-bold">{{ data.todosCompleted.count }}</div>
            <div class="text-xs text-gray-400 mt-1">marked done today</div>
          </div>
        </div>

        <!-- Cold Calls -->
        <div class="col-6 lg:col-3">
          <div
            class="surface-card p-3 border-round-xl shadow-1 cursor-pointer summary-card"
            :class="{ 'card-active': expanded === 'coldCalls' }"
            @click="toggle('coldCalls')"
          >
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="text-gray-500 text-xs font-medium">Cold Calls</span>
              <span class="bg-purple-100 text-purple-600 border-round p-1">
                <i class="pi pi-phone text-sm"></i>
              </span>
            </div>
            <div class="text-2xl font-bold">{{ data.coldCalls.count }}</div>
            <div class="text-xs text-gray-400 mt-1">
              {{ topOutcome }}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Detail panels ───────────────────────────────────────────── -->

      <!-- Businesses Detail -->
      <div v-if="expanded === 'businesses'" class="surface-card border-round-xl shadow-1 p-4">
        <div class="flex align-items-center justify-content-between mb-3">
          <h3 class="m-0 text-base font-semibold">
            <i class="pi pi-building mr-2 text-blue-600"></i>
            Businesses Added
          </h3>
          <Button icon="pi pi-times" text rounded size="small" @click="expanded = null" />
        </div>
        <div
          v-if="data.businesses.items.length === 0"
          class="text-gray-400 text-sm py-3 text-center"
        >
          No businesses were added on this day.
        </div>
        <div v-else class="flex flex-column gap-2">
          <div
            v-for="b in data.businesses.items"
            :key="b.id"
            class="flex align-items-center justify-content-between p-2 border-round-lg hover:surface-hover transition-colors transition-duration-150"
            style="border: 1px solid var(--surface-border)"
          >
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm">{{ b.name }}</div>
              <div class="text-xs text-gray-400 mt-1">
                <span v-if="b.type">{{ b.type }}</span>
                <span v-if="b.city">· {{ b.city }}</span>
                <span v-if="b.added_by_name">· Added by {{ b.added_by_name }}</span>
              </div>
            </div>
            <div class="flex align-items-center gap-2 ml-2">
              <Tag :value="b.status" :severity="businessStatusSeverity(b.status)" />
              <RouterLink :to="`/businesses/${b.id}`">
                <Button icon="pi pi-arrow-right" text rounded size="small" />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks Added Detail -->
      <div v-if="expanded === 'todosAdded'" class="surface-card border-round-xl shadow-1 p-4">
        <div class="flex align-items-center justify-content-between mb-3">
          <h3 class="m-0 text-base font-semibold">
            <i class="pi pi-plus-circle mr-2 text-orange-600"></i>
            Tasks Added
          </h3>
          <Button icon="pi pi-times" text rounded size="small" @click="expanded = null" />
        </div>
        <div
          v-if="data.todosAdded.items.length === 0"
          class="text-gray-400 text-sm py-3 text-center"
        >
          No tasks were created on this day.
        </div>
        <div v-else class="flex flex-column gap-2">
          <div
            v-for="t in data.todosAdded.items"
            :key="t.id"
            class="flex align-items-center gap-3 p-2 border-round-lg"
            style="border: 1px solid var(--surface-border)"
          >
            <i
              class="pi flex-shrink-0"
              :class="
                t.status === 'done' ? 'pi-check-circle text-green-500' : 'pi-circle text-gray-300'
              "
            ></i>
            <div class="flex-1 min-w-0">
              <div
                class="font-medium text-sm"
                :class="t.status === 'done' ? 'line-through text-gray-400' : ''"
              >
                {{ t.title }}
              </div>
              <div v-if="t.description" class="text-xs text-gray-400 mt-1 truncate-text">
                {{ t.description }}
              </div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <Tag
                :value="t.priority"
                :severity="prioritySeverity(t.priority)"
                style="font-size: 0.6rem; padding: 1px 5px"
              />
              <Tag
                :value="t.status.replace('_', ' ')"
                severity="secondary"
                style="font-size: 0.6rem; padding: 1px 5px"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks Completed Detail -->
      <div v-if="expanded === 'todosCompleted'" class="surface-card border-round-xl shadow-1 p-4">
        <div class="flex align-items-center justify-content-between mb-3">
          <h3 class="m-0 text-base font-semibold">
            <i class="pi pi-check-circle mr-2 text-green-600"></i>
            Tasks Completed
          </h3>
          <Button icon="pi pi-times" text rounded size="small" @click="expanded = null" />
        </div>
        <div
          v-if="data.todosCompleted.items.length === 0"
          class="text-gray-400 text-sm py-3 text-center"
        >
          No tasks were completed on this day.
        </div>
        <div v-else class="flex flex-column gap-2">
          <div
            v-for="t in data.todosCompleted.items"
            :key="t.id"
            class="flex align-items-center gap-3 p-2 border-round-lg"
            style="border: 1px solid var(--surface-border)"
          >
            <i class="pi pi-check-circle text-green-500 flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm line-through text-gray-400">{{ t.title }}</div>
              <div v-if="t.description" class="text-xs text-gray-400 mt-1 truncate-text">
                {{ t.description }}
              </div>
            </div>
            <Tag
              :value="t.priority"
              :severity="prioritySeverity(t.priority)"
              style="font-size: 0.6rem; padding: 1px 5px"
            />
          </div>
        </div>
      </div>

      <!-- Cold Calls Detail -->
      <div v-if="expanded === 'coldCalls'" class="surface-card border-round-xl shadow-1 p-4">
        <div class="flex align-items-center justify-content-between mb-3">
          <h3 class="m-0 text-base font-semibold">
            <i class="pi pi-phone mr-2 text-purple-600"></i>
            Cold Calls
          </h3>
          <Button icon="pi pi-times" text rounded size="small" @click="expanded = null" />
        </div>

        <!-- Outcome breakdown chips -->
        <div v-if="data.coldCalls.count > 0" class="flex gap-2 flex-wrap mb-3">
          <div
            v-for="(count, outcome) in data.coldCalls.outcomeCounts"
            :key="outcome"
            class="flex align-items-center gap-1 px-2 py-1 border-round-lg text-xs font-medium"
            :style="outcomeChipStyle(outcome)"
          >
            <i class="pi" :class="outcomeIcon(outcome)"></i>
            {{ outcomeLabel(outcome) }}: {{ count }}
          </div>
        </div>

        <div
          v-if="data.coldCalls.items.length === 0"
          class="text-gray-400 text-sm py-3 text-center"
        >
          No cold calls were logged on this day.
        </div>
        <div v-else class="flex flex-column gap-2">
          <div
            v-for="c in data.coldCalls.items"
            :key="c.id"
            class="p-2 border-round-lg"
            style="border: 1px solid var(--surface-border)"
          >
            <div class="flex align-items-center justify-content-between gap-2">
              <div class="flex align-items-center gap-2 min-w-0">
                <i class="pi pi-building text-gray-400 text-sm flex-shrink-0"></i>
                <RouterLink
                  :to="`/businesses/${c.business_id}`"
                  class="font-medium text-sm text-primary no-underline hover:underline"
                >
                  {{ c.business_name }}
                </RouterLink>
              </div>
              <Tag :value="outcomeLabel(c.outcome)" :severity="outcomeSeverity(c.outcome)" />
            </div>
            <div v-if="c.notes" class="text-xs text-gray-500 mt-1 ml-4">
              {{ c.notes }}
            </div>
            <div v-if="c.next_followup" class="text-xs text-orange-500 mt-1 ml-4">
              <i class="pi pi-calendar mr-1"></i>
              Follow-up: {{ formatDate(c.next_followup) }}
            </div>
            <div v-if="c.caller_name" class="text-xs text-gray-400 mt-1 ml-4">
              Logged by {{ c.caller_name }}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty day message ───────────────────────────────────────── -->
      <div
        v-if="totalActivity === 0 && !expanded"
        class="surface-card border-round-xl shadow-1 p-6 text-center"
      >
        <i class="pi pi-calendar-times text-4xl text-gray-300 mb-3 block"></i>
        <div class="text-gray-400 text-sm">No activity recorded for this day.</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { progressApi } from '@/api/progress';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import Tag from 'primevue/tag';
import { computed, onMounted, ref, watch } from 'vue';

// ── State ────────────────────────────────────────────────────────────
const selectedDate = ref(new Date());
const data = ref(null);
const loading = ref(false);
const error = ref(null);
const expanded = ref(null); // 'businesses' | 'todosAdded' | 'todosCompleted' | 'coldCalls' | null

// ── Date helpers ─────────────────────────────────────────────────────
function toYMD(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

const isToday = computed(() => toYMD(selectedDate.value) === toYMD(new Date()));

const formattedDate = computed(() =>
  selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
);

function shiftDate(days) {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() + days);
  if (d > new Date()) return;
  selectedDate.value = d;
}

function goToday() {
  selectedDate.value = new Date();
}

function onDateSelect() {
  // DatePicker already updated selectedDate via v-model
}

// ── Fetch ─────────────────────────────────────────────────────────────
async function load() {
  loading.value = true;
  error.value = null;
  expanded.value = null;
  try {
    data.value = await progressApi.getDaily(toYMD(selectedDate.value));
    // Auto-expand the section with the most activity
    if (data.value) {
      const counts = {
        businesses: data.value.businesses.count,
        todosAdded: data.value.todosAdded.count,
        todosCompleted: data.value.todosCompleted.count,
        coldCalls: data.value.coldCalls.count,
      };
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top[1] > 0) expanded.value = top[0];
    }
  } catch (e) {
    error.value = e.message || 'Failed to load progress data.';
  } finally {
    loading.value = false;
  }
}

watch(selectedDate, load);
onMounted(load);

// ── Toggle expand ─────────────────────────────────────────────────────
function toggle(section) {
  expanded.value = expanded.value === section ? null : section;
}

// ── Computed ──────────────────────────────────────────────────────────
const totalActivity = computed(() => {
  if (!data.value) return 0;
  return (
    data.value.businesses.count +
    data.value.todosAdded.count +
    data.value.todosCompleted.count +
    data.value.coldCalls.count
  );
});

const topOutcome = computed(() => {
  if (!data.value || data.value.coldCalls.count === 0) return 'no calls';
  const counts = data.value.coldCalls.outcomeCounts;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[1]} ${outcomeLabel(top[0])}` : 'calls made';
});

// ── Outcome helpers ───────────────────────────────────────────────────
function outcomeLabel(outcome) {
  const map = {
    no_answer: 'No Answer',
    not_interested: 'Not Interested',
    callback: 'Callback',
    interested: 'Interested',
    converted: 'Converted',
    unknown: 'Unknown',
  };
  return map[outcome] || outcome?.replace('_', ' ') || '—';
}

function outcomeSeverity(outcome) {
  const map = {
    converted: 'success',
    interested: 'info',
    callback: 'warn',
    no_answer: 'secondary',
    not_interested: 'danger',
  };
  return map[outcome] || 'secondary';
}

function outcomeIcon(outcome) {
  const map = {
    no_answer: 'pi-phone-slash',
    not_interested: 'pi-thumbs-down',
    callback: 'pi-clock',
    interested: 'pi-star',
    converted: 'pi-check-circle',
  };
  return map[outcome] || 'pi-circle';
}

function outcomeChipStyle(outcome) {
  const map = {
    converted: 'background:#d1fae5;color:#065f46',
    interested: 'background:#dbeafe;color:#1e40af',
    callback: 'background:#fef3c7;color:#92400e',
    no_answer: 'background:#f3f4f6;color:#6b7280',
    not_interested: 'background:#fee2e2;color:#991b1b',
  };
  return map[outcome] || 'background:#f3f4f6;color:#6b7280';
}

// ── Business / Todo helpers ───────────────────────────────────────────
function businessStatusSeverity(status) {
  const map = {
    new: 'secondary',
    contacted: 'info',
    interested: 'warn',
    converted: 'success',
    rejected: 'danger',
  };
  return map[status] || 'secondary';
}

function prioritySeverity(p) {
  return { high: 'danger', medium: 'warning', low: 'info' }[p] || 'info';
}

function formatDate(val) {
  if (!val) return '';
  // Treat YYYY-MM-DD strings as local dates to avoid UTC shift
  const d = /^\d{4}-\d{2}-\d{2}$/.test(val) ? new Date(val + 'T00:00:00') : new Date(val);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.summary-card {
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
  border: 2px solid transparent;
}
.summary-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.card-active {
  border-color: var(--primary-color);
}
.truncate-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 20rem;
}
</style>
