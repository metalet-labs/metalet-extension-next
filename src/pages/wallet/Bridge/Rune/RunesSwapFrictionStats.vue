<script setup lang="ts">
import Decimal from 'decimal.js'
import { computed, watch, ref } from 'vue'
import { calcBalance } from '@/lib/formatters'
import { FeeRateSelector } from '@/components'
import { DUST_UTXO_VALUE, RUNES_SWAP_2X_TX_SIZE, SWAP_POOL_ADD_TX_SIZE, SWAP_TX_SIZE } from '@/data/constants'

const currentRateFee = ref<number>()
const props = defineProps(['taskType', 'token1Amount', 'serviceFee'])
const emit = defineEmits(['returnBecameNegative', 'returnBecamePositive', 'feeRateOnchange'])

const taskGas = computed(() => {
  if (!currentRateFee.value) return 0

  let txSize: number
  switch (props.taskType) {
    case 'add':
      txSize = SWAP_POOL_ADD_TX_SIZE
      break
    case '2x':
    case 'x1':
      txSize = RUNES_SWAP_2X_TX_SIZE
      break
    default:
      txSize = SWAP_TX_SIZE
  }

  return currentRateFee.value * txSize
})
const prettyTaskGas = computed(() => {
  if (!taskGas.value) return '0'

  const feeInBtc = taskGas.value

  return `≈ ${calcBalance(feeInBtc, 8, 'BTC')}`
})

const showFinal = computed(() => {
  return ['2x'].includes(props.taskType) && props.token1Amount
})
const finalToken1Amount = computed(() => {
  if (!props.token1Amount) return 0

  const finalAmount = new Decimal(props.token1Amount).minus(props.serviceFee).minus(taskGas.value)

  return finalAmount.toNumber()
})

const prettyFinalToken1Amount = computed(() => {
  if (!finalToken1Amount.value) return '0'

  return `${calcBalance(finalToken1Amount.value, 8, 'BTC')} `
})

const negativeReturn = computed(() => {
  return finalToken1Amount.value <= DUST_UTXO_VALUE
})

watch(
  () => negativeReturn.value,
  (n) => {
    if (n) {
      emit('returnBecameNegative')
    } else {
      emit('returnBecamePositive')
    }
  },
  { immediate: true }
)

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
      <span class="text-zinc-500">Transaction Gas</span>
      <div class="flex items-center gap-3">
        <div class="text-gray-primary">{{ prettyTaskGas }}</div>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs lg:text-sm" v-if="showFinal">
      <span class="text-zinc-500">Finally Receive</span>
      <div class="flex items-center gap-3">
        <!-- <div :class="negativeReturn ? 'font-bold text-red-500' : 'text-zinc-300'">
          {{ prettyFinalToken1Amount }}
        </div> -->
        <div class="text-right text-xs text-zinc-500 lg:text-sm" v-if="taskGas && !negativeReturn">
          {{ calcBalance(finalToken1Amount, 8, 'BTC') }}
        </div>
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
