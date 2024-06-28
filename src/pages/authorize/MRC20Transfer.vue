<script lang="ts" setup>
import { computed } from 'vue'
import actions from '@/data/authorize-actions'
import { useBTCRateQuery } from '@/queries/transaction'
import { MRC20TransferParams } from '@/lib/actions/btc/mrc20-transfer'

const action = actions.MRC20DTransfer

const props = defineProps<{
  params: MRC20TransferParams
}>()

const { data: rateList } = useBTCRateQuery()

const currentCommitFeeRate = computed(() => {
  if (props.params.commitFeeRate) {
    return Number(props.params.commitFeeRate)
  }
  if (rateList.value) {
    const _rate = rateList.value.find((reteItem) => reteItem.title === 'Avg')
    if (_rate) {
      return Number(_rate.feeRate)
    }
  }
})

const currentRevealFeeRate = computed(() => {
  if (props.params.revealFeeRate) {
    return Number(props.params.revealFeeRate)
  }
  if (rateList.value) {
    const _rate = rateList.value.find((reteItem) => reteItem.title === 'Avg')
    if (_rate) {
      return Number(_rate.feeRate)
    }
  }
})
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-base">{{ action.title }}</h3>
    <div class="space-y-2">
      <div class="label">Commit Fee Rate: {{ currentCommitFeeRate }}</div>
      <div class="label">Reveal Fee Rate: {{ currentRevealFeeRate }}</div>
      <div class="label">MRC20 ID: {{ params.mrc20TickId }}</div>
    </div>
  </div>
</template>
