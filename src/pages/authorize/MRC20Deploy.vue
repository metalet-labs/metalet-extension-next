<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useBTCRateQuery } from '@/queries/transaction'

export interface MRC20DeployParams {
  body: {
    tick: string
    tokenName: string
    decimals: string
    amtPerMint: string
    mintCount: string
    premineCount: string
    blockheight: string
    metadata?: string
    qual: {
      path?: string
      count?: string
      lvl?: string
    }
  }
  flag?: 'metaid' | 'testid'
  revealAddr?: string
  commitFeeRate: number
  revealFeeRate: number
  changeAddress?: string
  revealOutValue?: number
  preMined?: {
    address: string
    satoshis: number
  }
  service?: {
    address: string
    satoshis: string
  }
}

const isShowingDetails = ref(false)

const props = defineProps<{
  params: MRC20DeployParams
}>()

console.log('MRC20Deploy', props)

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
  <div class="bg-white absolute inset-0 p-4 flex flex-col">
    <div class="py-4 grow space-y-2">
      <div class="label mt-4">Commit Fee Rate: {{ currentCommitFeeRate }}</div>
      <div class="label mt-4">Reveal Fee Rate: {{ currentRevealFeeRate }}</div>
      <div>{{ JSON.stringify(params) }}</div>
    </div>
  </div>
</template>
