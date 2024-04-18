<script setup lang="ts">
import { getLogo } from '@/data/logos'
import { getScanUrl } from '@/lib/host'
import { type Chain } from '@/lib/types'
import { useRouter, useRoute } from 'vue-router'
import LinkIcon from '@/assets/icons-v3/link.svg'
import { FlexBox, Divider, Button } from '@/components'
import SuccessPNG from '@/assets/icons-v3/send-success.png'

const route = useRoute()
const router = useRouter()

const chain = route.params.chain as Chain
const symbol = route.params.symbol as string
const amount = route.params.amount as string
const receiver = route.params.address as string
const txId = route.params.txId as string

const logo = getLogo(symbol, chain)

const scanUrl = getScanUrl('btc')

function toWallet() {
  router.push('/wallet')
}
</script>

<template>
  <FlexBox d="col" ai="center" class="relative w-full h-full gap-y-6 pt-[68px]">
    <img :src="SuccessPNG" alt="Send Success" class="w-30" />
    <div class="text-base">Transaction Completed</div>
    <div class="flex flex-col items-center justify-center border border-gray-soft py-3.5 px-4 rounded-lg">
      <FlexBox ai="center" :gap="1">
        <img v-if="logo" :src="logo" :alt="symbol" class="w-5 h-5" />
        <div v-else class="w-5 h-5 leading-5 rounded-full text-center text-white text-xs bg-blue-primary">
          {{ symbol[0].toLocaleUpperCase() }}
        </div>
        <div>{{ amount }} {{ symbol }}</div>
      </FlexBox>
      <div class="label mt-1">Amount</div>
      <Divider :dashed="true" class="my-3.5 border-gray-soft w-full" />
      <div class="break-all text-center mb-1">{{ receiver }}</div>
      <div class="label">Receiver</div>
    </div>
    <a :href="scanUrl + '/tx/' + txId" target="_blank" class="flex items-center gap-1 hover:text-blue-primary text-xs">
      <span>View on Block Explorer</span>
      <LinkIcon class="w-3.5 h-3.5" />
    </a>
    <Button type="primary" @click="$router.replace('/wallet')" class="mt-16 w-61.5 h-12">Done</Button>
  </FlexBox>
</template>

<style lang="css" scoped>
.label {
  @apply text-xs text-gray-primary;
}
</style>
