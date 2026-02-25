<template>
  <li>
    <RouterLink :to="to" custom v-slot="{ isActive, navigate }">
      <a
        @click="navigate"
        class="flex align-items-center gap-3 px-3 py-2 border-round cursor-pointer no-underline transition-colors transition-duration-150"
        :class="
          isActive ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        "
      >
        <i :class="`pi ${icon} text-sm`"></i>
        <span class="text-sm">{{ label }}</span>
      </a>
    </RouterLink>
  </li>
</template>

<script setup>
defineProps({ to: String, icon: String, label: String });
</script>
