<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AssetItem from './AssetItem.vue'
import { getAssetsDisplay } from '@/lib/assets'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMVCAssetsQuery } from '@/queries/tokens'
import { useBRC20AssetsQuery } from '@/queries/brc20'
import { CoinCategory } from '@/queries/exchange-rates'
import { getServiceNetwork, type Service } from '@/lib/network'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { type Asset, BTCAsset, MVCAsset, FTAsset } from '@/data/assets'

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

const { data: btcAssets } = useBRC20AssetsQuery(btcAddress, {
  enabled: computed(() => !!btcAddress.value),
})

const { data: mvcAssets } = useMVCAssetsQuery(mvcAddress, {
  enabled: computed(() => !!mvcAddress.value),
  autoRefresh: true,
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

function toToken(token: FTAsset, address: string) {
  router.push({
    name: 'token',
    params: { genesis: token.genesis, symbol: token.symbol, address },
  })
}
</script>

<template>
  <div class="mt-2 space-y-5 text-black divide-y divide-gray-light">
    <template v-if="!!serviceNetwork && ['all', 'btc'].includes(serviceNetwork)">
      <div class="space-y-2 divide-y divide-gray-light">
        <AssetItem
          :asset="BTCAsset"
          :address="btcAddress"
          :coinCategory="CoinCategory.Native"
          @click="toNative(BTCAsset, btcAddress)"
        />
        <AssetItem
          :asset="asset"
          :key="asset.symbol"
          :address="btcAddress"
          v-for="asset in btcAssets"
          :coinCategory="CoinCategory.BRC20"
          @click="toBRC20(asset, btcAddress)"
        />
      </div>
    </template>

    <template v-if="!!serviceNetwork && ['all', 'mvc'].includes(serviceNetwork)">
      <div class="space-y-2 divide-y divide-gray-light">
        <AssetItem
          :asset="MVCAsset"
          :address="mvcAddress"
          :coinCategory="CoinCategory.Native"
          @click="toNative(MVCAsset, mvcAddress)"
        />
        <AssetItem
          :asset="asset"
          :key="asset.genesis"
          :address="mvcAddress"
          v-for="asset in mvcAssets"
          @click="toToken(asset, mvcAddress)"
          :coinCategory="CoinCategory.MetaContract"
        />
      </div>
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
