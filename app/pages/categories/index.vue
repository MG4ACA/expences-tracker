<script setup>
  import CategoryForm from '@/components/categories/CategoryForm.vue';
  import CategoryList from '@/components/categories/CategoryList.vue';
  import { useAuth } from '@/composables/useAuth';
  import { useCategoriesStore } from '@/stores/categories';
  import { storeToRefs } from 'pinia';
  import { onMounted } from 'vue';

  const catStore = useCategoriesStore();
  const { items, isLoading } = storeToRefs(catStore);
  const { userId } = useAuth();

  onMounted(async () => {
    if (userId.value && items.value.length === 0) {
      await catStore.loadCategories();
    }
  });

  function addCategory(payload) {
    catStore.addCategory(payload);
  }
</script>

<template>
  <div class="et-gap">
    <h1 class="et-page-title">Categories</h1>

    <CategoryForm @submit="addCategory" />

    <CategoryList :categories="items" />
  </div>
</template>
