<script lang="ts" setup>
import { computed } from 'vue'
import actions from '@/data/authorize-actions'
import { useBTCRateQuery } from '@/queries/transaction'
import { MRC20TransferWithInscribeParams } from '@/lib/actions/btc/mrc20-transfer-with-inscribe'

const action = actions.MRC20Transfer

const props = defineProps<{
  params: MRC20TransferWithInscribeParams
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
      <div class="label">Commit {{ $t('Common.FeeRate') }}: {{ currentCommitFeeRate }}</div>
      <div class="label">Reveal {{ $t('Common.FeeRate') }}: {{ currentRevealFeeRate }}</div>
      <div class="label">{{ $t('Common.Amount') }}: {{ params.amount }}</div>
      <div class="label break-all">Content: {{ params.body }}</div>
    </div>
  </div>
</template>
