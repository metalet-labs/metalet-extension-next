<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'

const { backRouter } = defineProps<{
  backRouter?: string
}>()

const router = useRouter()
</script>

<template>
  <div class="grid grid-cols-5 items-center text-gray-900 p-4 h-15">
    <!-- back arrow -->
    <div class="col-span-1 flex items-center">
      <button @click="backRouter ? router.push(backRouter) : router.back()">
        <ChevronLeftIcon class="w-6 h-6" />
      </button>
    </div>

    <!-- title -->
    <div class="col-span-3 justify-self-center text-base truncate max-w-64">
      <slot name="title"></slot>
    </div>
  </div>
</template>
