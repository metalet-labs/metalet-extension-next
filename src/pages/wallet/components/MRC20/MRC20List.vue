<script lang="ts" setup>
import { useRouter } from 'vue-router'
import AssetItem from '../AssetItem.vue'
import { ref, computed, watch } from 'vue'
import ManageToken from '../ ManageToken.vue'
import { type MRC20Asset } from '@/data/assets'
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import { Chain } from '@metalet/utxo-wallet-service'
import { CoinCategory } from '@/queries/exchange-rates'
import { getAssetManageList } from '@/lib/asset-manage'
import { LoadingText, LoadingIcon } from '@/components'
import { useMRC20sInfiniteQuery } from '@/queries/mrc20'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const size = ref(100000)
const router = useRouter()
const selectList = ref<string[]>([])
const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

watch(
  address,
  (_address) => {
    if (_address) {
      getAssetManageList(_address).then((list) => {
        selectList.value = [...selectList.value, ...list]
      })
    }
  },
  { immediate: true }
)

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
      :coinCategory="CoinCategory.MRC20"
      @click="toMRC20Detail(asset, address)"
      v-for="(asset, index) in mrc20s?.filter((asset) => !selectList.includes(`${CoinCategory.MRC20}-${asset.symbol}`))"
    />
    <div
      v-if="hasNextPage"
      :disabled="isFetchingNextPage"
      @click="() => fetchNextPage()"
      :class="[
        'text-gray-primary flex items-center gap-2 justify-center py-4',
        !isFetchingNextPage ? 'cursor-pointer hover:text-blue-500 hover:underline' : 'cursor-not-allowed',
      ]"
    >
      <span class="text-ss">Load more MRC20s</span>
      <LoadingIcon v-if="isFetchingNextPage" class="text-gray-primary" />
    </div>
    <div v-else-if="!isLoading && mrc20s.length === 0" class="w-full py-12">
      <EmptyIcon class="mx-auto" />
    </div>
  </div>
  <ManageToken />
</template>
