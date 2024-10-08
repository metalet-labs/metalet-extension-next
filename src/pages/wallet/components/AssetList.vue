<script lang="ts" setup>
import { useRouter } from 'vue-router'
import AssetItem from './AssetItem.vue'
import { ref, computed, watch } from 'vue'
import ManageToken from './ ManageToken.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import { useBRC20AssetsQuery } from '@/queries/brc20'
import { useRunesAssetsQuery } from '@/queries/runes'
import { CoinCategory } from '@/queries/exchange-rates'
import { getAssetManageList } from '@/lib/asset-manage'
import { useMetaContractAssetsQuery } from '@/queries/tokens'
import { getServiceNetwork, type Service } from '@/lib/network'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { BTCAsset, MVCAsset, type Asset, type MetaContractAsset, type RuneAsset } from '@/data/assets'

const router = useRouter()
const { getAddress } = useChainWalletsStore()

const selectList = ref<string[]>([])
const serviceNetwork = ref<Service>([])

const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)

getServiceNetwork().then((_serviceNetwork) => {
  serviceNetwork.value = _serviceNetwork
})

watch(
  btcAddress,
  (address) => {
    if (address) {
      getAssetManageList(address).then((list) => {
        selectList.value = [...selectList.value, ...list]
      })
    }
  },
  { immediate: true }
)

watch(
  mvcAddress,
  (address) => {
    if (address) {
      getAssetManageList(address).then((list) => {
        selectList.value = [...selectList.value, ...list]
      })
    }
  },
  { immediate: true }
)

const { data: brc20Assets } = useBRC20AssetsQuery(btcAddress, {
  enabled: computed(() => !!btcAddress.value),
})

const { data: runeAssets } = useRunesAssetsQuery(btcAddress, {
  enabled: computed(() => !!btcAddress.value),
})

const { data: mvcAssets } = useMetaContractAssetsQuery(mvcAddress, {
  enabled: computed(() => !!mvcAddress.value),
  autoRefresh: computed(() => !!mvcAddress.value),
})

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

function toToken(token: MetaContractAsset, address: string) {
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
            v-if="!selectList.includes(`${CoinCategory.Native}-${BTCAsset.symbol}`)"
          />
          <AssetItem
            :asset="asset"
            :key="asset.symbol"
            :address="btcAddress"
            v-for="asset in brc20Assets?.filter(
              (asset) => !selectList.includes(`${CoinCategory.BRC20}-${asset.symbol}`)
            )"
            :coinCategory="CoinCategory.BRC20"
            @click="toBRC20(asset, btcAddress)"
          />
          <AssetItem
            :asset="asset"
            :key="asset.symbol"
            :address="btcAddress"
            :coinCategory="CoinCategory.Runes"
            @click="toRune(asset, btcAddress)"
            v-for="asset in runeAssets?.filter(
              (asset) => !selectList.includes(`${CoinCategory.Runes}-${asset.symbol}`)
            )"
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
            v-if="!selectList.includes(`${CoinCategory.Native}-${MVCAsset.symbol}`)"
          />
          <AssetItem
            :asset="asset"
            :key="asset.genesis"
            :address="mvcAddress"
            @click="toToken(asset, mvcAddress)"
            :coinCategory="CoinCategory.MetaContract"
            v-for="asset in mvcAssets?.filter(
              (asset) => !selectList.includes(`${CoinCategory.MetaContract}-${asset.symbol}`)
            )"
          />
        </div>
      </template>
    </div>

    <ManageToken />
  </div>
</template>
