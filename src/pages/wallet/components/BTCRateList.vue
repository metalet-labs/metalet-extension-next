<script lang="ts" setup>
import { ref, watch } from 'vue'
import { type FeeRate, useBTCRateQuery } from '@/queries/transaction'

const emit = defineEmits(['update:currentRateFee'])

const { isLoading: rateLoading, data: rateList } = useBTCRateQuery()

const isCustom = ref(false)
const selectedIndex = ref(-1)
const selectRateFee = (rateFee: number, index: number) => {
  emit('update:currentRateFee', rateFee)
  isCustom.value = false
  selectedIndex.value = index
}

const selectCustom = () => {
  emit('update:currentRateFee', undefined)
  isCustom.value = true
  selectedIndex.value = -1
}

watch(
  rateList,
  (newRateList?: FeeRate[]) => {
    if (newRateList && newRateList[1]) {
      selectRateFee(newRateList[1].feeRate, 1)
    }
  },
  { immediate: true }
)
</script>

<template>
  <!-- fee rate -->
  <div v-if="!rateLoading && rateList">
    <div class="text-gray-primary mt-[30px] text-sm">{{ $t('Common.FeeRate') }}</div>

    <div class="grid grid-cols-3 gap-2 text-xs mt-1.5 text-black-primary">
      <div
        v-for="(rate, index) in rateList"
        @click="selectRateFee(rate.feeRate, index)"
        :class="index === selectedIndex ? 'border-[#1E2BFF]' : 'border-[#D8D8D8]'"
        class="flex flex-col items-center justify-center rounded-md border cursor-pointer aspect-square"
      >
        <div class="text-xs">{{ rate.title }}</div>
        <div class="mt-1.5 text-sm">{{ rate.feeRate }} sat/vB</div>
        <div class="mt-1 text-xs text-[#999999]">About</div>
        <div class="text-xs text-[#999999]">{{ rate.desc.replace('About', '') }}</div>
      </div>
      <div
        @click="selectCustom()"
        :class="isCustom ? 'border-[#1E2BFF]' : 'border-[#D8D8D8]'"
        class="flex flex-col items-center justify-center rounded-md border cursor-pointer aspect-square"
      >
        <div>Custom</div>
      </div>
    </div>

    <input
      min="0"
      type="number"
      v-if="isCustom"
      placeholder="sat/vB"
      class="main-input w-full rounded-xl p-4 text-xs mt-4"
      @input="(e) => emit('update:currentRateFee', Number((e.currentTarget as HTMLInputElement).value))"
    />
  </div>
</template>
