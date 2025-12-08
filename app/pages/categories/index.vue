<script setup>
import CategoryForm from '@/components/categories/CategoryForm.vue';
import CategoryList from '@/components/categories/CategoryList.vue';
import { useCategoriesStore } from '@/stores/categories';
import { storeToRefs } from 'pinia';

const catStore = useCategoriesStore();
const { items } = storeToRefs(catStore);

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
