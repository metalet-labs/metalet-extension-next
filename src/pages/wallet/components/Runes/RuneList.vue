<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AssetItem from '../AssetItem.vue'
import { type RuneAsset } from '@/data/assets'
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import { Chain } from '@metalet/utxo-wallet-service'
import { CoinCategory } from '@/queries/exchange-rates'
import { useRunesInfiniteQuery } from '@/queries/runes'
import { LoadingText, LoadingIcon } from '@/components'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const size = ref(10)
const router = useRouter()
const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useRunesInfiniteQuery(address, size, {
  enabled: computed(() => !!address.value),
})

const runes = computed(() => (data.value ? data.value.pages.flatMap((page) => page.list) : []))

function toRune(asset: RuneAsset, address: string) {
  router.push({
    name: 'rune-detail',
    params: { runeId: asset.runeId, address, name: asset.tokenName, symbol: asset.symbol },
  })
}
</script>

<template>
  <div class="space-y-2 divide-y divide-gray-light">
    <LoadingText text="Runes Loading..." v-if="isLoading" />
    <AssetItem
      :key="index"
      :asset="asset"
      :address="address"
      :coinCategory="CoinCategory.Rune"
      v-for="(asset, index) in runes"
      @click="toRune(asset, address)"
    />
    <div
      v-if="hasNextPage"
      :disabled="isFetchingNextPage"
      @click="() => fetchNextPage()"
      :class="[
        'text-gray-primary flex items-center gap-2 justify-center pt-2',
        !isFetchingNextPage ? 'cursor-pointer hover:text-blue-500 hover:underline' : 'cursor-not-allowed',
      ]"
    >
      <span>Load more Runes</span>
      <LoadingIcon v-if="isFetchingNextPage" class="text-gray-primary" />
    </div>
    <div v-else-if="!isLoading && runes.length === 0" class="w-full py-12">
      <EmptyIcon class="mx-auto" />
    </div>
  </div>
</template>
