<template>
  <div class="flex flex-column gap-4">
    <div class="flex align-items-center gap-2">
      <Button icon="pi pi-arrow-left" text size="small" @click="$router.back()" />
      <h2 class="m-0">Finance Categories</h2>
    </div>

    <div class="grid">
      <!-- Income categories -->
      <div class="col-12 md:col-6">
        <div class="surface-card p-4 border-round-xl shadow-1">
          <div class="flex align-items-center justify-content-between mb-3">
            <h3 class="m-0 text-green-600">
              <i class="pi pi-arrow-up mr-2"></i>
              Income
            </h3>
            <Button icon="pi pi-plus" size="small" text @click="openDialog('income')" />
          </div>
          <div
            v-for="cat in incomeCategories"
            :key="cat.id"
            class="flex align-items-center justify-content-between py-2 border-bottom-1 border-gray-100"
          >
            <span>{{ cat.name }}</span>
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="deleteCategory(cat.id)"
            />
          </div>
          <div v-if="incomeCategories.length === 0" class="text-gray-400 text-sm py-2">
            No categories yet
          </div>
        </div>
      </div>

      <!-- Expense categories -->
      <div class="col-12 md:col-6">
        <div class="surface-card p-4 border-round-xl shadow-1">
          <div class="flex align-items-center justify-content-between mb-3">
            <h3 class="m-0 text-red-500">
              <i class="pi pi-arrow-down mr-2"></i>
              Expense
            </h3>
            <Button icon="pi pi-plus" size="small" text @click="openDialog('expense')" />
          </div>
          <div
            v-for="cat in expenseCategories"
            :key="cat.id"
            class="flex align-items-center justify-content-between py-2 border-bottom-1 border-gray-100"
          >
            <span>{{ cat.name }}</span>
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="deleteCategory(cat.id)"
            />
          </div>
          <div v-if="expenseCategories.length === 0" class="text-gray-400 text-sm py-2">
            No categories yet
          </div>
        </div>
      </div>
    </div>

    <!-- Add Dialog -->
    <Dialog v-model:visible="dialogVisible" header="Add Category" modal style="width: 340px">
      <div class="flex flex-column gap-3 pt-2">
        <div>
          <label class="text-sm font-medium block mb-1">Category Name *</label>
          <InputText v-model="newName" class="w-full" placeholder="e.g. Freelancing" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">Type</label>
          <Dropdown
            v-model="newType"
            :options="[
              { label: 'Income', value: 'income' },
              { label: 'Expense', value: 'expense' },
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
        <Button label="Add" :loading="saving" @click="addCategory" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useFinance } from '@/composables/useFinance';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import { computed, onMounted, ref } from 'vue';

const { categories, error, clearError, loadCategories, createCategory, removeCategory } =
  useFinance();

const dialogVisible = ref(false);
const newName = ref('');
const newType = ref('expense');
const saving = ref(false);

const incomeCategories = computed(() => categories.value.filter((c) => c.type === 'income'));
const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'));

function openDialog(type) {
  newType.value = type;
  newName.value = '';
  clearError();
  dialogVisible.value = true;
}

async function addCategory() {
  if (!newName.value) return;
  saving.value = true;
  try {
    await createCategory({ name: newName.value, type: newType.value });
    dialogVisible.value = false;
  } catch {
    // error.value shown inline
  } finally {
    saving.value = false;
  }
}

async function deleteCategory(id) {
  await removeCategory(id);
}

onMounted(loadCategories);
</script>
