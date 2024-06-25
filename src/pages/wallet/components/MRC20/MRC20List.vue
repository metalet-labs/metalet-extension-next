<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AssetItem from '../AssetItem.vue'
import { type MRC20Asset } from '@/data/assets'
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import { Chain } from '@metalet/utxo-wallet-service'
import { CoinCategory } from '@/queries/exchange-rates'
import { LoadingText, LoadingIcon } from '@/components'
import { useMRC20sInfiniteQuery } from '@/queries/mrc20'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const size = ref(10)
const router = useRouter()
const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useMRC20sInfiniteQuery(address, size, {
  enabled: computed(() => !!address.value),
})

const mrc20s = computed(() => (data.value ? data.value.pages.flatMap((page) => page.list) : []))

function toMRC20Detail(asset: MRC20Asset, address: string) {
  router.push({
    name: 'mrc20-detail',
    params: { mrc20Id: asset.mrc20Id, address, name: asset.tokenName, symbol: asset.symbol },
  })
}
</script>

<template>
  <div class="space-y-2 divide-y divide-gray-light">
    <LoadingText text="MRC20s Loading..." v-if="isLoading" />
    <AssetItem
      :key="index"
      :asset="asset"
      :address="address"
      v-for="(asset, index) in mrc20s"
      :coinCategory="CoinCategory.MRC20"
      @click="toMRC20Detail(asset, address)"
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
      <span>Load more MRC20s</span>
      <LoadingIcon v-if="isFetchingNextPage" class="text-gray-primary" />
    </div>
    <div v-else-if="!isLoading && mrc20s.length === 0" class="w-full py-12">
      <EmptyIcon class="mx-auto" />
    </div>
  </div>
</template>
