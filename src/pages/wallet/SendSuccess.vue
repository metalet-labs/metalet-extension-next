<script setup lang="ts">
import { computed } from 'vue'
import { toTx } from '@/lib/helpers'
import { useRoute } from 'vue-router'
import { type Chain } from '@/lib/types'
import { getBrowserHost } from '@/lib/host'
import LinkIcon from '@/assets/icons-v3/link.svg'
import { FlexBox, Divider, Button } from '@/components'
import SuccessPNG from '@/assets/icons-v3/send-success.png'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'

const route = useRoute()

const txId = route.params.txId as string
const chain = route.params.chain as Chain
const symbol = route.params.symbol as string
const amount = route.params.amount as string
const genesis = route.query.genesis as string
const receiver = route.params.address as string
const coinCategory = route.params.coinCategory as CoinCategory

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(coinCategory, genesis || symbol) || '')

// const logo = getLogo(symbol, chain)

// TODO: make it into utils
const toScanUrl = async (txId: string) => {
  const host = await getBrowserHost(chain)
  toTx(txId, host as string)
}
</script>

<template>
  <FlexBox d="col" ai="center" class="relative w-full h-full gap-y-6 pt-[68px]">
    <img :src="SuccessPNG" alt="Send Success" class="w-30" />
    <div class="text-base">{{ $t('Transaction.Completed') }}</div>
    <div class="flex flex-col items-center justify-center border border-gray-soft py-3.5 px-4 rounded-lg">
      <FlexBox ai="center" :gap="1">
        <img v-if="logo" :src="logo" :alt="symbol" class="w-5 h-5" />
        <div v-else class="w-5 h-5 leading-5 rounded-full text-center text-white text-xs bg-blue-primary">
          {{ symbol[0].toLocaleUpperCase() }}
        </div>
        <div>{{ amount }} {{ symbol }}</div>
      </FlexBox>
      <div class="label mt-1">{{ $t('Common.Amount') }}</div>
      <Divider :dashed="true" class="my-3.5 border-gray-soft w-full" />
      <div class="break-all text-center mb-1">{{ receiver }}</div>
      <div class="label">{{ $t('Common.Receiver') }}</div>
    </div>
    <div class="flex items-center gap-1 hover:text-blue-primary text-xs hover:underline" @click="toScanUrl(txId)">
      <span>{{ $t('Common.ViewOnBlockExplorer') }}</span>
      <LinkIcon class="w-3.5 h-3.5" />
    </div>
    <Button type="primary" @click="$router.replace('/wallet')" class="w-61.5 h-12">{{ $t('Common.Done') }}</Button>
  </FlexBox>
</template>

<style lang="css" scoped>
.label {
  @apply text-xs text-gray-primary;
}
</style>
