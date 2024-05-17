<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from '@/components/ui/toast'
import { prettifyTxId } from '@/lib/formatters'
import { SymbolTicker } from '@/lib/asset-symbol'
import { useIconsStore } from '@/stores/IconsStore'
import { Chain } from '@metalet/utxo-wallet-service'
import { CoinCategory } from '@/queries/exchange-rates'
import { Divider, Copy, AssetLogo } from '@/components'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const tag = route.query.tag as string
console.log(tag)

const address = ref(route.params.address as string)
const qrcode = useQRCode(address.value)
const genesis = route.query.genesis as string
const symbol = route.params.symbol as SymbolTicker
const coinCategory = (route.params.coinCategory as CoinCategory) || CoinCategory.Native

const chain = computed(() => {
  if (route.query.chain) {
    return route.query.chain as Chain
  }
  if (route.params.symbol === 'BTC') {
    return Chain.BTC
  } else if (route.params.symbol === 'SPACE') {
    return Chain.MVC
  }
})

const network = computed(() => {
  if (symbol === 'BTC' || chain.value === 'btc') {
    return 'Bitcoin'
  } else if (symbol === 'SPACE' || chain.value === 'mvc') {
    return 'MicrovisionChain'
  }
})

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(coinCategory, genesis || symbol) || '')
</script>

<template>
  <div class="flex flex-col w-full h-full absolute top-0 left-0 bg-gray-secondary">
    <div class="w-full h-15 flex items-center justify-between px-4">
      <ChevronLeftIcon class="w-4.5 cursor-pointer" @click="$router.go(-1)" />
      <XMarkIcon class="w-4.5 cursor-pointer" @click="$router.replace('/wallet')" />
    </div>
    <div class="p-4 grow">
      <div class="w-full h-full rounded-xl bg-white flex flex-col items-center py-6">
        <AssetLogo :chain="chain" type="network" :symbol="symbol" :logo="logo" class="w-15" />
        <div class="mt-3 font-medium">
          <span>{{ symbol }}</span>
        </div>
        <div class="text-xs px-1.5 py-0.5 rounded inline-block bg-gray-light text-gray-primary" v-if="tag">
          {{ tag }}
        </div>
        <Divider class="w-[232px] my-4" />
        <img :src="qrcode" alt="" class="w-[232px] h-[232px] rounded-lg" />
        <div
          class="mt-3 flex px-3 py-3.5 items-center justify-between w-[232px] gap-4 border border-gray-soft rounded-lg relative"
        >
          <span>{{ prettifyTxId(address) }}</span>
          <Copy
            :text="address"
            class="w-[22px]"
            @click="toast({ title: `${network}  Address Copied`, toastType: 'success', description: address })"
          />
        </div>
      </div>
    </div>
  </div>
</template>
