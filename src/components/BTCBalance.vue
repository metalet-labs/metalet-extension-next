<script setup>
import Decimal from 'decimal.js';
import { ref } from 'vue'

defineProps({
  balance: [String, Number, Decimal],
  safeBalance: [String, Number, Decimal],
  tooltipText: {
    type: String,
    default: 'Balance shows total BTC amount, safe balance shows confirmed amount'
  }
})

const showTooltip = ref(false)
</script>

<template>
  <div
    class="flex items-center justify-between w-full text-xs leading-5 text-primary bg-[#f5f5f5] rounded-full p-3  relative">
    <div class="flex items-center gap-1 text-nowrap">
      <span class=" text-[#999] text-nowrap">{{ $t('Common.Avail') }} <span class="text-[#303133]">{{ new Decimal(safeBalance
        ||
        0).div(10 ** 8).toFixed(8) }} BTC</span>
      </span>
      <span class="border-l border-gray-300 h-4 mx-1"></span>
      <span class="text-[#999] text-nowrap">
        N/A <span class="text-[#303133]">{{ new Decimal((balance - safeBalance) || 0).div(10 ** 8).toFixed(8) }}
          BTC</span>
      </span>
    </div>
    <button
      class="w-4 h-4 flex items-center justify-center text-[#666] hover:text-[#333] transition-colors rounded-full border border-[#666]"
      @click.stop="showTooltip = !showTooltip">
      ?
    </button>
    <Teleport to="body">
      <div v-if="showTooltip" class="fixed inset-0 z-[9999] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/20" @click="showTooltip = false"></div>
        <div class="relative bg-white rounded-xl p-4 max-w-xs mx-4 shadow-lg">
          <div class="flex items-start gap-2">
            <button
              class="w-4 h-4 flex-shrink-0 flex items-center justify-center text-[#676767] rounded-full border border-[#676767]">
              ?
            </button>
            <p class="text-sm text-[#676767]">{{ $t('Common.BTCBalanceTooltip') }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Styles removed - using Tailwind classes instead */
</style>
