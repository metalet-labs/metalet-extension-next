<template>
  <div
    class="mb-4 flex items-center gap-4 rounded-xl border border-brc20/50 bg-gray-secondary p-4 text-xs shadow shadow-runes/10"
  >
    <DropletsIcon class="h-6 w-6 text-brc20" />
    <div class="space-y-1">
      <p>{{ $t('SwapPage.NoLiquidityTips') }}</p>
      <p>{{ $t('SwapPage.AddLiquidityTips') }}</p>
    </div>
  </div>
</template>

<script setup>
import { DropletsIcon } from 'lucide-vue-next'
</script>

<style scoped></style>
