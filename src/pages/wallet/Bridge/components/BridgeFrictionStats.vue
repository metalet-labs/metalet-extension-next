<script setup lang="ts">
import { watch, ref } from 'vue'
import { FeeRateSelector } from '@/components'

const currentRateFee = ref<number>()
const emit = defineEmits(['feeRateOnchange'])
defineProps(['limitMinimum', 'limitMaximum'])

watch(
  () => currentRateFee.value,
  (_currentRateFee) => {
    emit('feeRateOnchange', _currentRateFee)
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-col gap-2 p-4 text-xs lg:text-sm">
    <FeeRateSelector class="w-full" v-model:currentRateFee="currentRateFee" />

    <div class="flex items-center justify-between text-xs lg:text-sm">
      <span class="font-medium">Minimum Bridging Quantity</span>
      <div class="flex items-center gap-3">
        <div class="text-gray-primary">{{ limitMinimum }}</div>
      </div>
    </div>
    <div class="flex items-center justify-between text-xs lg:text-sm">
      <span class="font-medium">Maximum Bridging Quantity</span>
      <div class="flex items-center gap-3">
        <div class="text-gray-primary">{{ limitMaximum }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply text-zinc-300;
}
</style>
