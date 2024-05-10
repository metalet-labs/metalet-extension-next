<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { allAssets } from '@/data/assets'
import { toast } from '@/components/ui/toast'
import { prettifyTxId } from '@/lib/formatters'
import { SymbolTicker } from '@/lib/asset-symbol'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'
import { Divider, Copy, AssetLogo } from '@/components'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const address = ref(route.params.address as string)
const qrcode = useQRCode(address.value)
const asset = computed(() => allAssets.find((asset) => asset.symbol === route.params.symbol))

const network = computed(() => {
  if (route.params.symbol === 'BTC') {
    return 'Bitcoin'
  } else if (route.params.symbol === 'SPACE') {
    return 'Microvisionchain'
  }
})

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.Native, route.params.symbol as SymbolTicker) || '')
</script>

<template>
  <div class="flex flex-col w-full h-full absolute top-0 left-0 bg-gray-secondary" v-if="asset">
    <div class="w-full h-15 flex items-center justify-between px-4">
      <ChevronLeftIcon class="w-4.5 cursor-pointer" @click="$router.go(-1)" />
      <XMarkIcon class="w-4.5 cursor-pointer" @click="$router.replace('/wallet')" />
    </div>
    <div class="p-4 grow">
      <div class="w-full h-full rounded-xl bg-white flex flex-col items-center py-6">
        <AssetLogo :chain="asset.chain" type="network" :symbol="asset.symbol" :logo="logo" class="w-15" />
        <div class="mt-3 font-medium">{{ asset.symbol }}</div>
        <div class="text-gray-primary text-xs text-center w-60">
          Only supports receiving {{ network }} network assets
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
