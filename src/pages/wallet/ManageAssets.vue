<script lang="ts" setup>
import { computed, ref } from 'vue'
import { allAssets, Asset } from '@/data/assets'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMVCAssetsQuery } from '@/queries/tokens'
import { useBRC20AssetsQuery } from '@/queries/brc20'
import { useRunesAssetsQuery } from '@/queries/runes'
import AssetSelect from './components/AssetSelect.vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { getAssetManageList } from '@/lib/asset-manage'
import { useMRC20sInfiniteQuery } from '@/queries/mrc20'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const selectList = ref<string[]>([])

const { getAddress } = useChainWalletsStore()

const btcAddress = getAddress(Chain.BTC)

const mvcAddress = getAddress(Chain.MVC)

const { data: brc20Assets } = useBRC20AssetsQuery(btcAddress, {
  enabled: computed(() => !!btcAddress.value),
})

const { data: runeAssets } = useRunesAssetsQuery(btcAddress, {
  enabled: computed(() => !!btcAddress.value),
})

const { data: metaContractAssets } = useMVCAssetsQuery(mvcAddress, {
  enabled: computed(() => !!mvcAddress.value),
  autoRefresh: true,
})

const { data } = useMRC20sInfiniteQuery(btcAddress, ref(1000000), {
  enabled: computed(() => !!btcAddress.value),
})

const mrc20Assets = computed(() => (data.value ? data.value.pages.flatMap((page) => page.list) : []))

getAssetManageList(btcAddress.value).then((list) => {
  selectList.value = [...selectList.value, ...list]
})

getAssetManageList(mvcAddress.value).then((list) => {
  selectList.value = [...selectList.value, ...list]
})

function setSelected(asset: Asset, coinCategory: CoinCategory) {
  console.log(1111)

  if (selectList.value.includes(`${CoinCategory.Native}-${asset.symbol}`)) {
    selectList.value = selectList.value.filter((item) => item !== `${CoinCategory.Native}-${asset.symbol}`)
  } else {
    selectList.value.push(`${CoinCategory.Native}-${asset.symbol}`)
  }
}
</script>

<template>
  <div class="divide-y divide-gray-100 text-black">
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      v-for="asset in allAssets"
      :coinCategory="CoinCategory.Native"
      :selected="!selectList.includes(`${CoinCategory.Native}-${asset.symbol}`)"
    />
    <AssetSelect
      v-for="asset in mrc20Assets"
      :key="asset.symbol"
      :asset="asset"
      :coinCategory="CoinCategory.MRC20"
      :selected="!selectList.includes(`${CoinCategory.MRC20}-${asset.symbol}`)"
    />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      v-for="asset in brc20Assets"
      :coinCategory="CoinCategory.BRC20"
      :selected="!selectList.includes(`${CoinCategory.BRC20}-${asset.symbol}`)"
    />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      v-for="asset in runeAssets"
      :coinCategory="CoinCategory.Rune"
      :selected="!selectList.includes(`${CoinCategory.Rune}-${asset.symbol}`)"
    />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      v-for="asset in metaContractAssets"
      :coinCategory="CoinCategory.MetaContract"
      :selected="!selectList.includes(`${CoinCategory.MetaContract}-${asset.symbol}`)"
    />
  </div>
</template>
