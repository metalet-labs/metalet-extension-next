<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { allAssets, Asset } from '@/data/assets'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMVCAssetsQuery } from '@/queries/tokens'
import { useBRC20AssetsQuery } from '@/queries/brc20'
import { useRunesAssetsQuery } from '@/queries/runes'
import SearchInput from '@/components/SearchInput.vue'
import AssetSelect from './components/AssetSelect.vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { useMRC20sInfiniteQuery } from '@/queries/mrc20'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { getAssetManageList, setAssetManage } from '@/lib/asset-manage'

const assetSearch = ref()
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

const { data: _mrc20Assets } = useMRC20sInfiniteQuery(btcAddress, ref(1000000), {
  enabled: computed(() => !!btcAddress.value),
})

const mrc20Assets = computed(() => (_mrc20Assets.value ? _mrc20Assets.value.pages.flatMap((page) => page.list) : []))

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

async function setSelected(asset: Asset, coinCategory: CoinCategory, enabled: boolean) {
  if (selectList.value.includes(`${coinCategory}-${asset.symbol}`)) {
    selectList.value = selectList.value.filter((item) => item !== `${coinCategory}-${asset.symbol}`)
  } else {
    selectList.value.push(`${coinCategory}-${asset.symbol}`)
  }
  await setAssetManage(
    asset.chain === Chain.BTC ? btcAddress.value : mvcAddress.value,
    coinCategory,
    asset.symbol,
    enabled
  )
}
</script>

<template>
  <div class="divide-y divide-gray-100 text-black">
    <SearchInput v-model:assetSearch="assetSearch" />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      :selectList="selectList"
      :coinCategory="CoinCategory.Native"
      @setSelected="(enabled) => setSelected(asset, CoinCategory.Native, enabled)"
      v-for="asset in allAssets.filter(
        (asset) =>
          !assetSearch ||
          asset.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
          asset.tokenName.toLowerCase().includes(assetSearch.toLowerCase())
      )"
    />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      :selectList="selectList"
      :coinCategory="CoinCategory.MRC20"
      @setSelected="(enabled) => setSelected(asset, CoinCategory.MRC20, enabled)"
      v-for="asset in mrc20Assets?.filter(
        (asset) =>
          !assetSearch ||
          asset.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
          asset.tokenName.toLowerCase().includes(assetSearch.toLowerCase())
      )"
    />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      :selectList="selectList"
      :coinCategory="CoinCategory.BRC20"
      @setSelected="(enabled) => setSelected(asset, CoinCategory.BRC20, enabled)"
      v-for="asset in brc20Assets?.filter(
        (asset) =>
          !assetSearch ||
          asset.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
          asset.tokenName.toLowerCase().includes(assetSearch.toLowerCase())
      )"
    />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      :selectList="selectList"
      :coinCategory="CoinCategory.Rune"
      @setSelected="(enabled) => setSelected(asset, CoinCategory.Rune, enabled)"
      v-for="asset in runeAssets?.filter(
        (asset) =>
          !assetSearch ||
          asset.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
          asset.tokenName.toLowerCase().includes(assetSearch.toLowerCase())
      )"
    />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      :selectList="selectList"
      :coinCategory="CoinCategory.MetaContract"
      @setSelected="(enabled) => setSelected(asset, CoinCategory.MetaContract, enabled)"
      v-for="asset in metaContractAssets?.filter(
        (asset) =>
          !assetSearch ||
          asset.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
          asset.tokenName.toLowerCase().includes(assetSearch.toLowerCase())
      )"
    />
  </div>
</template>
