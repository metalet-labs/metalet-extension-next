<script lang="ts" setup>
import { getNet } from '@/lib/network'
import { useRouter } from 'vue-router'
import { totalBalance } from '@/lib/balance'
import SwapIcon from '@/assets/icons-v3/swap.svg'
import BridgeIcon from '@/assets/icons-v3/bridge.svg'
import NetworkIcon from '@/assets/icons-v3/network.svg'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'
import { ArrowUpRightIcon, QrCodeIcon } from '@heroicons/vue/20/solid'

const router = useRouter()

function toSelectAsset(purpose: 'receive' | 'send') {
  router.push({ name: 'select-asset', params: { purpose } })
}
</script>

<template>
  <div>
    <div class="mt-2 flex items-center justify-between">
      <div class="text-[40px] leading-10 font-bold">$ {{ totalBalance.toFixed(2) }}</div>
      <div
        v-if="getNet() === 'testnet'"
        class="bg-[#CCD0FF] bg-opacity-20 py-2 px-3 rounded-lg text-[#1D28FE] flex items-center gap-1"
      >
        <NetworkIcon class="w-2.5" />
        <span class="text-xs">Testnet</span>
      </div>
    </div>

    <div class="text-black-secondary flex justify-between mt-6 text-ss" v-if="false">
      <div
        @click="toSelectAsset('send')"
        class="cursor-pointer flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <ArrowUpIcon class="w-4" />
        </div>
        <span>Send</span>
      </div>
      <div
        class="cursor-pointer flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
        @click="toSelectAsset('receive')"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <ArrowDownIcon class="w-4" />
        </div>
        <span>Receive</span>
      </div>
      <div class="cursor-not-allowed flex flex-col items-center gap-y-[11px] hover:text-blue-primary">
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <SwapIcon />
        </div>
        <span>Swap</span>
      </div>
      <div class="cursor-not-allowed flex flex-col items-center gap-y-[11px] hover:text-blue-primary">
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <BridgeIcon />
        </div>
        <span>Bridge</span>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2 mt-6 text-ss">
      <button class="button" @click="toSelectAsset('send')">
        <ArrowUpRightIcon class="mr-1 h-4 w-4" />
        <span>Send</span>
      </button>
      <button class="button" @click="toSelectAsset('send')">
        <QrCodeIcon class="mr-1 h-4 w-4" />
        <span>Receive</span>
      </button>
    </div>
  </div>
</template>

<style lang="css" scoped>
.button {
  @apply flex items-center justify-center rounded-md bg-btn-blue py-3 text-sm text-white;
}
</style>
