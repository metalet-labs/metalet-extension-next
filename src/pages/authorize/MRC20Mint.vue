<script lang="ts" setup>
import { computed } from 'vue'
import actions from '@/data/authorize-actions'
import { useBTCRateQuery } from '@/queries/transaction'
import { MRC20MintParams } from '@/lib/actions/btc/mrc20-mint'

const action = actions.MRC20Mint

const props = defineProps<{
  params: MRC20MintParams
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
      <div class="label">MRC20 ID: {{ params.id }}</div>
    </div>
  </div>
</template>
