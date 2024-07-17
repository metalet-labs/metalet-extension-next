<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AssetItem from './AssetItem.vue'
import ManageToken from './ ManageToken.vue'
import { getAssetsDisplay } from '@/lib/assets'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMVCAssetsQuery } from '@/queries/tokens'
import { useBRC20AssetsQuery } from '@/queries/brc20'
import { useRunesAssetsQuery } from '@/queries/runes'
import { CoinCategory } from '@/queries/exchange-rates'
import { getServiceNetwork, type Service } from '@/lib/network'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { type Asset, BTCAsset, MVCAsset, type FTAsset, type RuneAsset } from '@/data/assets'

const router = useRouter()
const { getAddress } = useChainWalletsStore()

const serviceNetwork = ref<Service>([])
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

const { data: runeAssets } = useRunesAssetsQuery(btcAddress, {
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

function toRune(asset: RuneAsset, address: string) {
  router.push({
    name: 'rune-detail',
    params: { runeId: asset.runeId, address, name: asset.tokenName, symbol: asset.symbol },
  })
}
</script>

<template>
  <div class="mt-2 space-y-4 text-black">
    <div class="divide-y divide-gray-light space-y-4">
      <template v-if="serviceNetwork.includes(Chain.BTC)">
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
          <AssetItem
            :asset="asset"
            :key="asset.symbol"
            :address="btcAddress"
            v-for="asset in runeAssets"
            :coinCategory="CoinCategory.Rune"
            @click="toRune(asset, btcAddress)"
          />
        </div>
      </template>

      <template v-if="serviceNetwork.includes(Chain.MVC)">
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
    </div>

    <ManageToken />
  </div>
</template>
