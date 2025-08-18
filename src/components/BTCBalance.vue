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
    class="flex items-center justify-between w-full text-sm leading-5 text-primary bg-[#f5f5f5] rounded-full p-3 font-sm relative">
    <div class="flex items-center gap-1">
      <span class="font-sm text-[#999]">{{ $t('Common.Avail') }} <span class="text-[#303133]">{{ new Decimal(safeBalance
        ||
        0).div(10 ** 8).toFixed(8) }} BTC</span>
      </span>
      <span class="border-l border-gray-300 h-4 mx-2"></span>
      <span class="text-[#999]">
        N/A <span class="text-[#303133]">{{ new Decimal((balance - safeBalance) || 0).div(10 ** 8).toFixed(8) }}
          BTC</span>
      </span>
    </div>
    <button
      class="w-4 h-4 flex items-center justify-center text-[#666] hover:text-[#333] transition-colors rounded-full border border-[#666]"
      @click.stop="showTooltip = !showTooltip">
      ?
    </button>
    <div v-if="showTooltip" @click.stop="showTooltip = !showTooltip"
      class="absolute top-full mt-2 p-3 text-xs text-[#676767] bg-white  rounded-xl  z-10 flex align-top gap-2 border border-[#eee]" >
      <button
        class="w-3 h-3 min-h-3 min-w-3 flex items-center justify-center text-[#676767] hover:text-[#676767] transition-colors rounded-full border border-[#676767]">
        ?
      </button>
      {{ $t('Common.BTCBalanceTooltip') }}
    </div>
  </div>
</template>

<style scoped>
/* Styles removed - using Tailwind classes instead */
</style>
