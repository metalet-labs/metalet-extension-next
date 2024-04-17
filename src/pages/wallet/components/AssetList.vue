<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AssetItem from './AssetItem.vue'
import { getAssetsDisplay } from '@/lib/assets'
import { useBRC20AssetQuery } from '@/queries/btc'
import { AddressTypeSelector } from '@/components'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMVCAssetsQuery } from '@/queries/tokens'
import { type Asset, BTCAsset, MVCAsset } from '@/data/assets'
import { getServiceNetwork, type Service } from '@/lib/network'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const router = useRouter()
const { getAddress } = useChainWalletsStore()

const serviceNetwork = ref<Service>()
const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)

getServiceNetwork().then((_serviceNetwork) => {
  serviceNetwork.value = _serviceNetwork
})

const assetsDisplay = ref<string[]>([])
getAssetsDisplay().then((display) => {
  assetsDisplay.value = display
})

const { isLoading: btcAssetsLoading, data: btcAssets } = useBRC20AssetQuery(btcAddress, {
  enabled: computed(() => !!btcAddress.value),
})

const { isFetching: mvcAssetsLoading, data: mvcAssets } = useMVCAssetsQuery(mvcAddress, {
  enabled: computed(() => !!mvcAddress.value),
})

function toManageAssets() {
  router.push('/wallet/manage-assets')
}

function toNative(asset: Asset, address: string) {
  router.push({
    name: 'asset',
    params: { symbol: asset.symbol, address },
  })
}

function toBRC20(asset: Asset, address: string) {
  router.push({
    name: 'brc20',
    params: { symbol: asset.symbol, address },
  })
}

function toToken(token: Asset, address: string) {
  router.push({
    name: 'token',
    params: { genesis: token.genesis, symbol: token.symbol, address },
  })
}
</script>

<template>
  <div class="mt-2 space-y-5 text-black">
    <template v-if="!!serviceNetwork && ['all', 'btc'].includes(serviceNetwork)">
      <div class="space-y-2" v-if="btcAddress">
        <AddressTypeSelector :chain="Chain.BTC" />
        <AssetItem :asset="BTCAsset" :address="btcAddress" @click="toNative(BTCAsset, btcAddress)" />
        <AssetItem
          :asset="asset"
          :key="asset.symbol"
          :address="btcAddress"
          v-for="asset in btcAssets"
          @click="toBRC20(asset, btcAddress)"
        />
      </div>
      <div v-else class="text-center text-gray-500 text-sm">BTC Asset Loading...</div>
    </template>

    <template v-if="!!serviceNetwork && ['all', 'mvc'].includes(serviceNetwork)">
      <AddressTypeSelector :chain="Chain.MVC" />
      <div class="space-y-2" v-if="mvcAddress">
        <AssetItem :asset="MVCAsset" :address="mvcAddress" @click="toNative(MVCAsset, mvcAddress)" />
        <AssetItem
          :asset="asset"
          :key="asset.genesis"
          :address="mvcAddress"
          v-for="asset in mvcAssets"
          @click="toToken(asset, mvcAddress)"
        />
      </div>
      <div v-else class="text-center text-gray-500 text-sm">MVC Asset Loading...</div>
    </template>

    <!-- Manage Token List -->
    <!-- <div class="flex items-center justify-center pb-4">
      <button class="hover-gradient-text group flex items-center gap-x-2 text-sm text-gray-500" @click="toManageAssets">
        <SquaresPlusIcon class="h-4 w-4 group-hover:text-blue-600" />
        <span>Manage Token List</span>
      </button>
    </div> -->
  </div>
</template>
