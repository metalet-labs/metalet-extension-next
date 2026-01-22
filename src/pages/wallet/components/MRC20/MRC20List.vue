<script lang="ts" setup>
import { useRouter } from 'vue-router'
import AssetItem from '../AssetItem.vue'
import Decimal from 'decimal.js'
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
const btcAddress = getAddress(Chain.BTC)
const dogeAddress = getAddress(Chain.DOGE)

watch(
  btcAddress,
  (_address) => {
    if (_address) {
      getAssetManageList(_address).then((list) => {
        selectList.value = [...selectList.value, ...list]
      })
    }
  },
  { immediate: true }
)

// BTC 地址的 MRC20
const { data: btcData, isLoading: btcLoading, hasNextPage: btcHasNextPage, fetchNextPage: btcFetchNextPage, isFetchingNextPage: btcIsFetchingNextPage } = useMRC20sInfiniteQuery(btcAddress, size, {
  enabled: computed(() => !!btcAddress.value),
})

// DOGE 地址的 MRC20
const { data: dogeData, isLoading: dogeLoading, hasNextPage: dogeHasNextPage, fetchNextPage: dogeFetchNextPage, isFetchingNextPage: dogeIsFetchingNextPage } = useMRC20sInfiniteQuery(dogeAddress, size, {
  enabled: computed(() => !!dogeAddress.value),
})

const isLoading = computed(() => btcLoading.value || dogeLoading.value)
const hasNextPage = computed(() => btcHasNextPage?.value || dogeHasNextPage?.value)
const isFetchingNextPage = computed(() => btcIsFetchingNextPage.value || dogeIsFetchingNextPage.value)

const fetchNextPage = () => {
  if (btcHasNextPage?.value) btcFetchNextPage()
  if (dogeHasNextPage?.value) dogeFetchNextPage()
}

// 合并 BTC 和 DOGE 的 MRC20 列表，按 mrc20Id 聚合
const mrc20s = computed(() => {
  const btcList = btcData.value ? btcData.value.pages.flatMap((page) => page.list) : []
  const dogeList = dogeData.value ? dogeData.value.pages.flatMap((page) => page.list) : []
  
  // 用 Map 按 mrc20Id 聚合，合并余额
  const mrc20Map = new Map<string, MRC20Asset & { sourceChain: 'btc' | 'doge', address: string }>()
  
  for (const asset of btcList) {
    mrc20Map.set(asset.mrc20Id, { ...asset, sourceChain: 'btc', address: btcAddress.value })
  }
  
  for (const asset of dogeList) {
    const existing = mrc20Map.get(asset.mrc20Id)
    if (!existing) {
      mrc20Map.set(asset.mrc20Id, { ...asset, sourceChain: 'doge', address: dogeAddress.value })
    } else {
      // 如果两个链都有，合并余额（显示总和）
      const existingBalance = existing.balance
      const newBalance = asset.balance
      
      if (existingBalance && newBalance) {
        // 合并余额
        const mergedBalance = {
          confirmed: existingBalance.confirmed.add(newBalance.confirmed),
          unconfirmed: existingBalance.unconfirmed.add(newBalance.unconfirmed),
          total: existingBalance.total.add(newBalance.total),
          pendingIn: (existingBalance.pendingIn || new Decimal(0)).add(newBalance.pendingIn || new Decimal(0)),
          pendingOut: (existingBalance.pendingOut || new Decimal(0)).add(newBalance.pendingOut || new Decimal(0)),
        }
        
        // 选择余额较多的链作为默认跳转目标
        const existingTotal = existingBalance.total.toNumber()
        const newTotal = newBalance.total.toNumber()
        const primaryChain = newTotal > existingTotal ? 'doge' : 'btc'
        const primaryAddress = primaryChain === 'doge' ? dogeAddress.value : btcAddress.value
        
        mrc20Map.set(asset.mrc20Id, { 
          ...existing, 
          balance: mergedBalance,
          sourceChain: primaryChain, 
          address: primaryAddress 
        })
      }
    }
  }
  
  return Array.from(mrc20Map.values())
})

function toMRC20Detail(asset: MRC20Asset & { sourceChain?: string, address?: string }) {
  const address = asset.address || btcAddress.value
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
      :asset="{ ...asset, chain: asset.sourceChain || 'btc' }"
      :address="asset.address || btcAddress"
      :coinCategory="CoinCategory.MRC20"
      @click="toMRC20Detail(asset)"
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
