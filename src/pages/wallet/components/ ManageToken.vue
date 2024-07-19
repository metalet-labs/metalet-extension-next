<script lang="ts" setup>
import { SquaresPlusIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div class="flex items-center justify-center sticky bottom-0 z-10">
    <span class="bg-white">
      <button
        @click="$router.push('/wallet/manage-assets')"
        class="hover-gradient-text group flex items-center gap-x-2 px-4 py-2 text-sm text-gray-500 border border-gray-soft rounded-full"
      >
        <SquaresPlusIcon class="h-4 w-4 group-hover:text-blue-600" />
        <span>Manage Token List</span>
      </button>
    </span>
  </div>
</template>
