<script lang="ts" setup>
import { IS_DEV } from '@/data/config'
import { useRouter } from 'vue-router'
import { totalBalance } from '@/lib/balance'
import SwapIcon from '@/assets/icons-v3/swap.svg'
import { Chain } from '@metalet/utxo-wallet-service'
import BridgeIcon from '@/assets/icons-v3/bridge.svg'
import NetworkIcon from '@/assets/icons-v3/network.svg'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import { network, getServiceNetwork } from '@/lib/network'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const router = useRouter()

const { getAddress } = useChainWalletsStore()
const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)

async function toSelectAsset(purpose: 'receive' | 'send') {
  const service = await getServiceNetwork()
  if (service.length === Object.values(Chain).length) {
    router.push({ name: 'select-asset', params: { purpose } })
  } else {
    const symbol = service.includes(Chain.BTC) ? 'BTC' : service.includes(Chain.MVC) ? 'SPACE' : ''
    const address = service.includes(Chain.BTC) ? btcAddress.value : service.includes(Chain.MVC) ? mvcAddress.value : ''
    if (purpose === 'receive') {
      router.push({ name: 'receive', params: { symbol, address } })
    } else if (purpose === 'send') {
      router.push({ name: 'send', params: { symbol, address } })
    }
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="text-[40px] leading-10 font-bold">$ {{ totalBalance.toFixed(2) }}</div>
      <div
        v-if="network !== 'mainnet'"
        class="bg-[#CCD0FF] bg-opacity-20 py-2 px-3 rounded-lg text-[#1D28FE] flex items-center gap-1"
      >
        <NetworkIcon class="w-2.5" />
        <span class="text-xs">{{ network.replace(/(^\w{1})/, (match: string) => match.toUpperCase()) }}</span>
      </div>
    </div>

    <div class="text-black-secondary flex justify-between mt-6 text-ss">
      <div
        @click="toSelectAsset('send')"
        class="cursor-pointer flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <ArrowUpIcon class="w-4" />
        </div>
        <span>{{ $t('Common.Send') }}</span>
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
        <span>{{ $t('Common.Receive') }}</span>
      </div>
      <a
        v-if="!IS_DEV"
        target="_blank"
        :href="network === 'testnet' ? 'https://testnet.orders.exchange/swap' : 'https://app.orders.exchange/swap'"
        class="cursor-pointer flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <SwapIcon class="w-4" />
        </div>
        <span>{{ $t('Common.Swap') }}</span>
      </a>
      <div
        v-else
        class="cursor-pointer flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
        @click="$router.push('/wallet/swap')"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <SwapIcon class="w-4" />
        </div>
        <span>{{ $t('Common.Swap') }}</span>
      </div>
      <div
        class="cursor-pointer flex flex-col items-center gap-y-[11px] hover:text-blue-primary"
        @click="$router.push('/wallet/bridge')"
      >
        <div
          class="w-12 h-12 text-white flex items-center justify-center rounded-full bg-gradient-to-b from-blue-primary to-[#69DFF7] hover:to-blue-primary"
        >
          <BridgeIcon />
        </div>
        <span>{{ $t('Common.Bridge') }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.button {
  @apply flex items-center justify-center rounded-md bg-btn-blue py-3 text-sm text-white;
}
</style>
