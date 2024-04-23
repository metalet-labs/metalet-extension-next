<script lang="ts" setup>
import { ref } from 'vue'
import { getNet } from '@/lib/network'
import { useRouter } from 'vue-router'
import { totalBalance } from '@/lib/balance'
import SwapIcon from '@/assets/icons-v3/swap.svg'
import BridgeIcon from '@/assets/icons-v3/bridge.svg'
import NetworkIcon from '@/assets/icons-v3/network.svg'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'

const router = useRouter()

const hoverIcon = ref()

function handleMouseOver(icon: string) {
  hoverIcon.value = icon // 鼠标悬停时切换图片
}

function handleMouseLeave() {
  hoverIcon.value = undefined // 鼠标离开时恢复原始图片
}

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

    <div class="text-black-secondary flex justify-between mt-6 text-[13px]">
      <div
        @click="toSelectAsset('send')"
        @mouseover="handleMouseOver('send')"
        @mouseleave="handleMouseLeave()"
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
        @mouseover="handleMouseOver('receive')"
        @mouseleave="handleMouseLeave()"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <ArrowDownIcon class="w-4" />
        </div>
        <span>Receive</span>
      </div>
      <div
        class="cursor-not-allowed flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
        @mouseover="handleMouseOver('swap')"
        @mouseleave="handleMouseLeave()"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <SwapIcon />
        </div>
        <span>Swap</span>
      </div>
      <div
        class="cursor-not-allowed flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
        @mouseover="handleMouseOver('bridge')"
        @mouseleave="handleMouseLeave()"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <BridgeIcon />
        </div>
        <span>Bridge</span>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.button {
  @apply flex items-center justify-center rounded-md bg-btn-blue py-3 text-sm text-white;
}
</style>
