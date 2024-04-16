<script lang="ts" setup>
import Decimal from 'decimal.js'
import { computed, ref, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import Ticker from './components/Ticker.vue'
import Loading from '@/components/Loading.vue'
import { calcBalance } from '@/lib/formatters'
import MintPNG from '@/assets/icons-v3/mint.png'
import { useRoute, useRouter } from 'vue-router'
import { SymbolTicker } from '@/lib/asset-symbol'
import AssetLogo from '@/components/AssetLogo.vue'
import { useBalanceQuery } from '@/queries/balance'
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import Activities from './components/Activities.vue'
import TickerList from './components/TickerList.vue'
import FilterIcon from '@/assets/icons-v3/filter.svg'
import TransferPNG from '@/assets/icons-v3/transfer.png'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { getTags, BTCAsset, MVCAsset } from '@/data/assets'
import { useBRCTickerAseetQuery, useBRC20AssetQuery } from '@/queries/btc'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import LoadingIcon from '@/components/LoadingIcon.vue'

const route = useRoute()
const router = useRouter()

if (!route.params.address) {
  router.go(-1)
}

const address = ref<string>(route.params.address as string)
const symbol = ref<SymbolTicker>(route.params.symbol as SymbolTicker)

const { data: btcAssets } = useBRC20AssetQuery(address, { enabled: computed(() => !!address.value) })

const asset = computed(() => {
  if (symbol.value === 'BTC') {
    return BTCAsset
  }
  if (symbol.value === 'SPACE') {
    return MVCAsset
  }
  if (btcAssets.value) {
    return btcAssets.value.find((asset) => asset.symbol === symbol.value!)
  }
})

const balaceEnabled = computed(() => {
  if (asset.value) {
    return !!address.value && !!symbol.value && !asset.value.balance
  }
  return false
})

const { isLoading, data: balance } = useBalanceQuery(address, symbol, {
  enabled: balaceEnabled,
})

const tickerEnabled = computed(() => !!address.value && !!symbol.value)

// TODO：修复useBRCTickerAseetQuery重新请求刷新
const {
  isLoading: tickersLoading,
  data: tickersData,
  refetch,
} = useBRCTickerAseetQuery(address, symbol, {
  enabled: tickerEnabled,
})

if (route.query.refresh) {
  refetch()
}

const transferableList = computed(() => tickersData.value?.transferableList)

const transferableBalance = computed(() => {
  if (tickersData.value?.tokenBalance) {
    return Number(tickersData.value?.tokenBalance.transferableBalance)
  }
  return '--'
})

const availableBalanceSafe = computed(() => {
  if (tickersData.value?.tokenBalance) {
    return Number(tickersData.value?.tokenBalance.availableBalance)
  }
  return '--'
})

const availableBalanceUnSafe = computed(() => {
  if (tickersData.value?.tokenBalance) {
    return Math.abs(Number(tickersData.value?.tokenBalance.availableBalanceUnSafe))
  }
})

const tags = computed(() => {
  if (asset.value) {
    return getTags(asset.value)
  }
})

const rateEnabled = computed(() => {
  if (asset.value) {
    return !!address.value && !!symbol.value
  }
  return false
})

const { isLoading: isExchangeRateLoading, data: exchangeRate } = useExchangeRatesQuery(
  symbol,
  ref(CoinCategory.BRC20),
  {
    enabled: rateEnabled,
  }
)

const assetUSD = computed(() => {
  if (isExchangeRateLoading.value) {
    return
  }
  const usdRate = new Decimal(exchangeRate.value?.price || 0)
  if (asset.value) {
    if (asset.value?.balance) {
      const balanceInStandardUnit = new Decimal(asset.value.balance?.total || 0).dividedBy(10 ** asset.value.decimal)
      return usdRate.mul(balanceInStandardUnit)
    } else if (balance.value && exchangeRate.value) {
      const balanceInStandardUnit = new Decimal(balance.value.total).dividedBy(10 ** asset.value.decimal)
      return usdRate.mul(balanceInStandardUnit)
    }
  }
})

watch(assetUSD, (_assetUSD) => {
  if (asset.value && _assetUSD) {
    updateAsset({ chain: asset.value.chain, name: asset.value.symbol, value: _assetUSD.toNumber() })
  }
})
</script>

<template>
  <div class="flex flex-col items-center space-y-6 w-full" v-if="asset">
    <div class="flex flex-col items-center">
      <AssetLogo :logo="asset.logo" :chain="asset.chain" :symbol="asset.symbol" type="network" class="w-15" />

      <div class="mt-3 text-2xl">
        <span v-if="asset.balance">{{ calcBalance(asset.balance.total, asset.decimal, asset.symbol) }}</span>
        <span v-else-if="balance">{{ calcBalance(balance.total, asset.decimal, asset.symbol) }}</span>
        <span v-else>-- {{ asset.symbol }}</span>
      </div>

      <div class="mt-0.5 text-sm text-gray-primary">$ {{ assetUSD?.toNumber() }} USD</div>

      <div
        v-for="tag in tags"
        :key="tag.name"
        :style="`background-color:${tag.bg};color:${tag.color};`"
        :class="['px-1.5', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'scale-75']"
      >
        {{ tag.name }}
      </div>
    </div>

    <div class="flex items-center justify-center gap-x-2">
      <RouterLink to="javascript:void(0);" class="btn-blue-light">
        <img :src="MintPNG" alt="Mint" />
        <span>Mint</span>
      </RouterLink>
      <RouterLink :to="`/wallet/transfer/${asset.symbol}/${address}`" class="btn-blue-primary">
        <img :src="TransferPNG" alt="Transfer" />
        <span>Transfer</span>
      </RouterLink>
    </div>

    <div class="border border-gray-soft rounded-lg w-full">
      <Tabs default-value="Transferable">
        <TabsList class="grid grid-cols-2">
          <TabsTrigger value="Transferable">
            <LoadingIcon class="mb-1" v-if="tickersLoading" />
            <span class="text-lg" v-else>{{ transferableBalance }}</span>
            <span class="text-sm text-gray-primary">Transferable</span>
          </TabsTrigger>
          <TabsTrigger value="Available">
            <LoadingIcon class="mb-1" v-if="tickersLoading" />
            <div class="text-lg" v-else>
              <span>{{ availableBalanceSafe }}</span>
              <span v-if="availableBalanceUnSafe" class="text-gray-primary">+ {{ availableBalanceUnSafe }}</span>
            </div>
            <span class="text-sm text-gray-primary">Available</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Transferable">
          <TickerList :list="transferableList" :loading="tickersLoading" />
        </TabsContent>
        <TabsContent value="Available">
          <div v-if="availableBalanceUnSafe" class="grid grid-cols-3 gap-x-2 gap-y-4">
            <Ticker :ticker="asset.symbol" :amount="availableBalanceUnSafe" />
          </div>
          <div v-else class="pt-6 pb-8">
            <EmptyIcon class="mx-auto" />
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <div class="w-full">
      <div class="-mx-4 h-11 bg-gray-light px-4 py-[13px] text-ss" v-if="false">
        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center justify-between w-full">
            <div class="flex items-center gap-x-2">
              <span>Time</span>
              <SelectorIcon />
            </div>
            <FilterIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="bg-white">
            <DropdownMenuItem @select="null">Time</DropdownMenuItem>
            <DropdownMenuItem @select="null">Other</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Activities class="mt-8 self-stretch" :asset="asset" :exchangeRate="Number(exchangeRate)" :address="address" />
    </div>
  </div>
  <Loading v-else text="Asset Loading..." />
</template>

<style scoped lang="css">
.btn {
  @apply w-[119px] h-12 rounded-3xl flex items-center justify-center gap-x-2;
}

.btn-blue-light {
  @apply btn bg-blue-light text-blue-primary;
}

.btn-blue-primary {
  @apply btn bg-blue-primary text-white;
}

:deep(div[role='tablist']) {
  @apply p-0 h-auto;
}

:deep(button[role='tab']) {
  @apply flex flex-col items-center px-0 py-4 rounded-none border-b-2 border-transparent;
}

:deep(button[role='tab'][aria-selected='true']) {
  @apply border-blue-primary;
}

:deep(div[role='tabpanel']) {
  @apply px-3 py-4 mt-0;
}
</style>
