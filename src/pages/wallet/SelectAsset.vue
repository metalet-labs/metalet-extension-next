<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Asset, allAssets } from '@/data/assets'
import { Chain as ChainType } from '@/lib/types'
import { useRouter, useRoute } from 'vue-router'
import AssetItem from './components/AssetItem.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import SearchInput from '@/components/SearchInput.vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { getServiceNetwork, type Service } from '@/lib/network'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const route = useRoute()
const assetSearch = ref()
const router = useRouter()
const { purpose } = route.params
const serviceNetwork = ref<Service>()

const { getAddress } = useChainWalletsStore()
const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)

getServiceNetwork().then((_serviceNetwork) => {
  serviceNetwork.value = _serviceNetwork
})

const selectAddress = (chain: ChainType) => {
  switch (chain) {
    case 'btc':
      return btcAddress.value
    case 'mvc':
      return mvcAddress.value
    default:
      return ''
  }
}

const assets = computed(() => {
  return allAssets.filter(
    (asset) =>
      (asset.chain === serviceNetwork.value || serviceNetwork.value === 'all') &&
      (!assetSearch.value ||
        asset.symbol.toLocaleLowerCase().includes(assetSearch.value) ||
        asset.tokenName.toLocaleLowerCase().includes(assetSearch.value))
  )
})

function selectAsset(asset: Asset) {
  router.push({
    name: purpose as string,
    params: {
      symbol: asset.symbol,
      address: asset.symbol === 'BTC' ? btcAddress.value : mvcAddress.value,
    },
  })
}

const toReceive = (symbol: string, address: string) => {
  router.push(`/wallet/receive/${symbol}/${address}`)
}
</script>

<template>
  <div class="pt-2 space-y-2">
    <SearchInput v-model:assetSearch="assetSearch" />
    <AssetItem
      :asset="asset"
      :key="asset.symbol"
      v-for="asset in assets"
      @click="selectAsset(asset)"
      v-if="btcAddress && mvcAddress"
      :coinCategory="CoinCategory.Native"
      :address="selectAddress(asset.chain)"
    />
  </div>
</template>
