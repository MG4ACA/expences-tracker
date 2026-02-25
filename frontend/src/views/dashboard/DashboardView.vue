<template>
  <div class="flex flex-column gap-4">
    <!-- Summary cards -->
    <div class="grid">
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round-xl shadow-1">
          <div class="flex align-items-center justify-content-between mb-3">
            <span class="text-gray-500 text-sm font-medium">Total Businesses</span>
            <span class="bg-blue-100 text-blue-600 border-round p-2">
              <i class="pi pi-building"></i>
            </span>
          </div>
          <div class="text-3xl font-bold">{{ stats.totalBusinesses }}</div>
          <div class="text-sm text-green-500 mt-1">{{ stats.converted }} converted</div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round-xl shadow-1">
          <div class="flex align-items-center justify-content-between mb-3">
            <span class="text-gray-500 text-sm font-medium">Open Tasks</span>
            <span class="bg-orange-100 text-orange-600 border-round p-2">
              <i class="pi pi-check-square"></i>
            </span>
          </div>
          <div class="text-3xl font-bold">{{ stats.openTodos }}</div>
          <div class="text-sm text-gray-400 mt-1">pending + in progress</div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round-xl shadow-1">
          <div class="flex align-items-center justify-content-between mb-3">
            <span class="text-gray-500 text-sm font-medium">Monthly Income</span>
            <span class="bg-green-100 text-green-600 border-round p-2">
              <i class="pi pi-arrow-up"></i>
            </span>
          </div>
          <div class="text-3xl font-bold text-green-600">{{ formatCurrency(summary.income) }}</div>
          <div class="text-sm text-gray-400 mt-1">{{ currentMonth }}</div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round-xl shadow-1">
          <div class="flex align-items-center justify-content-between mb-3">
            <span class="text-gray-500 text-sm font-medium">Monthly Expense</span>
            <span class="bg-red-100 text-red-600 border-round p-2">
              <i class="pi pi-arrow-down"></i>
            </span>
          </div>
          <div class="text-3xl font-bold text-red-500">{{ formatCurrency(summary.expense) }}</div>
          <div class="text-sm mt-1" :class="summary.net >= 0 ? 'text-green-500' : 'text-red-400'">
            Net: {{ formatCurrency(summary.net) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Follow-ups today -->
    <div class="surface-card p-4 border-round-xl shadow-1">
      <div class="flex align-items-center justify-content-between mb-3">
        <h3 class="m-0 text-lg font-semibold">Follow-ups Due Today</h3>
        <RouterLink to="/businesses" class="text-primary text-sm no-underline">View all</RouterLink>
      </div>
      <div v-if="followups.length === 0" class="text-gray-400 text-sm py-2">
        No follow-ups due today 🎉
      </div>
      <div
        v-for="b in followups"
        :key="b.id"
        class="flex align-items-center justify-content-between py-2 border-bottom-1 border-gray-100"
      >
        <div>
          <div class="font-medium">{{ b.name }}</div>
          <div class="text-xs text-gray-400">{{ b.type }} · {{ b.city }}</div>
        </div>
        <RouterLink :to="`/businesses/${b.id}`">
          <Button size="small" icon="pi pi-arrow-right" text />
        </RouterLink>
      </div>
    </div>

    <!-- Today's tasks -->
    <div class="surface-card p-4 border-round-xl shadow-1">
      <div class="flex align-items-center justify-content-between mb-3">
        <h3 class="m-0 text-lg font-semibold">Today's Tasks</h3>
        <RouterLink to="/todos" class="text-primary text-sm no-underline">View all</RouterLink>
      </div>
      <div v-if="todayTodos.length === 0" class="text-gray-400 text-sm py-2">
        No tasks due today
      </div>
      <div
        v-for="t in todayTodos"
        :key="t.id"
        class="flex align-items-center gap-3 py-2 border-bottom-1 border-gray-100"
      >
        <i
          class="pi"
          :class="
            t.status === 'done' ? 'pi-check-circle text-green-500' : 'pi-circle text-gray-400'
          "
        ></i>
        <span :class="t.status === 'done' ? 'line-through text-gray-400' : ''">{{ t.title }}</span>
        <Tag :value="t.priority" :severity="prioritySeverity(t.priority)" class="ml-auto" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { businessApi } from '@/api/businesses';
import { financeApi } from '@/api/finance';
import { todoApi } from '@/api/todos';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { computed, onMounted, ref } from 'vue';

const summary = ref({ income: 0, expense: 0, net: 0 });
const stats = ref({ totalBusinesses: 0, converted: 0, openTodos: 0 });
const followups = ref([]);
const todayTodos = ref([]);

const today = new Date().toISOString().slice(0, 10);
const currentMonth = computed(() =>
  new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
);

function formatCurrency(v) {
  return `LKR ${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function prioritySeverity(p) {
  return { high: 'danger', medium: 'warning', low: 'info' }[p] || 'info';
}

onMounted(async () => {
  const [fin, businesses, todos] = await Promise.all([
    financeApi.getSummary(new Date().toISOString().slice(0, 7)),
    businessApi.list(),
    todoApi.list(),
  ]);

  summary.value = fin;
  stats.value.totalBusinesses = businesses.length;
  stats.value.converted = businesses.filter((b) => b.status === 'converted').length;
  stats.value.openTodos = todos.filter((t) => t.status !== 'done').length;

  // Follow-ups due today — check last cold_call next_followup
  // Simplified: businesses that are 'contacted' or 'interested' shown as reminders
  followups.value = businesses
    .filter((b) => ['contacted', 'interested', 'callback'].includes(b.status))
    .slice(0, 5);

  todayTodos.value = todos.filter((t) => !t.due_date || t.due_date.slice(0, 10) === today);
});
</script>
