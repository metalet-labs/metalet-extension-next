<script lang="ts" setup>
import { computed, ref } from 'vue'
import { allAssets } from '@/data/assets'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMVCAssetsQuery } from '@/queries/tokens'
import { useBRC20AssetsQuery } from '@/queries/brc20'
import { useRunesAssetsQuery } from '@/queries/runes'
import AssetSelect from './components/AssetSelect.vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { useMRC20sInfiniteQuery } from '@/queries/mrc20'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

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
</script>

<template>
  <div class="divide-y divide-gray-100 text-black">
    <AssetSelect v-for="asset in allAssets" :key="asset.symbol" :asset="asset" :coinCategory="CoinCategory.Native" />
    <AssetSelect v-for="asset in mrc20Assets" :key="asset.symbol" :asset="asset" :coinCategory="CoinCategory.MRC20" />
    <AssetSelect v-for="asset in brc20Assets" :key="asset.symbol" :asset="asset" :coinCategory="CoinCategory.BRC20" />
    <AssetSelect v-for="asset in runeAssets" :key="asset.symbol" :asset="asset" :coinCategory="CoinCategory.Rune" />
    <AssetSelect
      :asset="asset"
      :key="asset.symbol"
      v-for="asset in metaContractAssets"
      :coinCategory="CoinCategory.MetaContract"
    />
  </div>
</template>
