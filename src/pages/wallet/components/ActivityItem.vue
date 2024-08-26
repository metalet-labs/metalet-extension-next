<script lang="ts" setup>
import { computed } from 'vue'
import Decimal from 'decimal.js'
import { toTx } from '@/lib/helpers'
import { FlexBox } from '@/components'
import { type Chain } from '@/lib/types'
import { getBrowserHost } from '@/lib/host'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { FTAsset, type Asset } from '@/data/assets'
import type { Activity } from '@/queries/activities'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { prettifyTimestamp, prettifyTxId } from '@/lib/formatters'

const props = defineProps<{
  asset: Asset
  icon?: string
  activity: Activity
  coinCategory: CoinCategory
}>()

const { getIcon } = useIconsStore()
const icon = computed(
  () =>
    props.icon ||
    getIcon(
      props.coinCategory,
      props.coinCategory === CoinCategory.MetaContract ? (props.asset as FTAsset).genesis : props.asset.symbol
    ) ||
    ''
)

const flow = computed(() => {
  const { outcome, income, actionType } = props.activity
  if (actionType === 'inscribeTransfer') {
    return 'Inscribe Transfer'
  } else if (actionType) {
    return actionType
  } else if (outcome > income) {
    return 'Send'
  } else if (income > outcome) {
    return 'Receive'
  } else {
    return 'Transfer'
  }
})

const isConfirmed = computed(() => {
  if (props.asset?.contract === 'BRC-20') {
    return true
  }
  return props.activity.height !== -1
})

const difference = computed(() => {
  const { outcome, income } = props.activity
  const { symbol, decimal } = props.asset
  let display
  let displayClass

  if (outcome > income) {
    display = `-${new Decimal((outcome - income) / 10 ** decimal).toFixed()}`
    displayClass = 'text-black-primary'
  } else if (outcome < income) {
    display = `+${new Decimal((income - outcome) / 10 ** decimal).toFixed()}`
    displayClass = 'text-green-700'
  } else {
    display = `0`
    displayClass = 'text-gray-primary'
  }

  return {
    display,
    displayClass,
  }
})

const toActivityTx = async () => {
  const { txid } = props.activity
  const chain = props.asset.chain as Chain
  const host = await getBrowserHost(chain)
  toTx(txid, host as string)
}
</script>

<template>
  <FlexBox ai="center" jc="between" class="py-3">
    <FlexBox ai="center" :gap="3">
      <AssetLogo
        :symbol="asset.symbol"
        :chain="asset.chain"
        :logo="icon"
        type="activity"
        class="w-[38px] text-lg"
        :flow="flow"
        logo-size="size-4"
      />
      <div>
        <div :class="['flex items-center gap-x-2 text-sm', { 'text-orange-primary': !isConfirmed }]">
          <span>{{ flow }}</span>
          <LoadingIcon v-if="!isConfirmed" class="text-orange-primary w-4 h-4" />
        </div>
        <div class="text-gray-primary text-xs">{{ prettifyTimestamp(activity.time) }}</div>
      </div>
    </FlexBox>
    <FlexBox d="col" ai="end">
      <div :class="['text-sm', difference.displayClass]">
        {{ difference.display }}
      </div>
      <div
        @click="toActivityTx"
        :title="activity.txid"
        class="text-xs text-gray-primary cursor-pointer hover:underline hover:text-blue-primary"
      >
        {{ prettifyTxId(activity.txid) }}
      </div>
    </FlexBox>
  </FlexBox>
</template>
