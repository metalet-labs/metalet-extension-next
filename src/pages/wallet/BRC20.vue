<script lang="ts" setup>
import Decimal from 'decimal.js'
import { getTags } from '@/data/assets'
import { LoadingText } from '@/components'
import { computed, ref, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import Ticker from './components/Ticker.vue'
import { calcBalance } from '@/lib/formatters'
import { useRoute, useRouter } from 'vue-router'
import MintPNG from '@/assets/icons-v3/mint.png'
import { SymbolTicker } from '@/lib/asset-symbol'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import { Chain } from '@metalet/utxo-wallet-service'
import Activities from './components/Activities.vue'
import TickerList from './components/TickerList.vue'
import { useBRC20AssetQuery } from '@/queries/brc20'
import LoadingIcon from '@/components/LoadingIcon.vue'
import TransferPNG from '@/assets/icons-v3/transfer.png'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const route = useRoute()
const router = useRouter()
const address = ref<string>(route.params.address as string)
const symbol = ref<SymbolTicker>(route.params.symbol as SymbolTicker)

const { currentBTCWallet } = useChainWalletsStore()

const { getIcon } = useIconsStore()
const icon = computed(() => getIcon(CoinCategory.BRC20, symbol.value) || '')

const tickerEnabled = computed(() => !!address.value && !!symbol.value)

// TODO：修复useBRCTickerAseetQuery重新请求刷新
const {
  refetch,
  data: asset,
  isLoading: tickersLoading,
} = useBRC20AssetQuery(address, symbol, { enabled: tickerEnabled })

if (route.query.refresh) {
  refetch()
}

const transferableList = computed(() => asset.value?.transferableList)

const transferableBalance = computed(() => asset.value?.balance.transferableBalance)

const availableBalanceSafe = computed(() => asset.value?.balance.availableBalanceSafe)

const availableBalanceUnSafe = computed(() => asset.value?.balance.availableBalanceUnSafe)

const tags = getTags('BRC-20')

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
      const balanceInStandardUnit = asset.value.balance.total.dividedBy(10 ** asset.value.decimal)
      return usdRate.mul(balanceInStandardUnit).toNumber()
    }
  }
})

const toReceive = () => {
  router.push(
    `/wallet/receive/${CoinCategory.BRC20}/${symbol.value}/${address.value}?tag=${currentBTCWallet.value?.getAddressType()}`
  )
}

watch(assetUSD, (_assetUSD) => {
  if (asset.value && _assetUSD) {
    updateAsset({ chain: asset.value.chain, name: asset.value.symbol, value: _assetUSD })
  }
})
</script>

<template>
  <div class="flex flex-col items-center gap-y-6 w-full h-full">
    <div class="flex flex-col items-center">
      <AssetLogo :logo="icon" :chain="Chain.BTC" :symbol="symbol" type="network" class="w-15" />

      <div class="mt-3 text-2xl text-balance max-w-full text-center">
        <span v-if="asset?.balance" class="break-all">
          {{ calcBalance(asset.balance.total.toNumber(), asset.decimal, asset.symbol) }}
        </span>
        <span v-else>-- {{ symbol }}</span>
        <span class="text-gray-primary ml-2" v-if="assetUSD !== undefined">≈ ${{ assetUSD.toFixed(2) }}</span>
      </div>

      <div
        :key="tag.name"
        v-for="tag in tags"
        :style="`background-color:${tag.bg};color:${tag.color};`"
        :class="['px-1', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'mt-2']"
      >
        {{ tag.name }}
      </div>
    </div>

    <div class="w-full flex flex-col gap-y-6 grow overflow-y-hidden">
      <div class="flex items-center justify-center gap-x-2">
        <RouterLink to="javascript:void(0);" class="btn-blue-light" v-if="false">
          <img :src="MintPNG" alt="Mint" />
          <span>Mint</span>
        </RouterLink>
        <RouterLink :to="`/wallet/transfer/${symbol}/${address}`" class="btn-blue-primary">
          <img :src="TransferPNG" alt="Transfer" />
          <span>Transfer</span>
        </RouterLink>
        <button @click="toReceive" class="btn-blue-primary">
          <ArrowDownIcon class="w-3" />
          <span>Receive</span>
        </button>
      </div>

      <div class="border border-gray-soft rounded-lg w-full max-h-90">
        <Tabs default-value="Transferable" class="flex flex-col h-full overflow-y-hidden">
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
              <Ticker :ticker="symbol" :amount="availableBalanceUnSafe" />
            </div>
            <div v-else class="pt-6 pb-8">
              <EmptyIcon class="mx-auto" />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Activities
        v-if="asset"
        :asset="asset"
        :address="address"
        :coinCategory="CoinCategory.BRC20"
        :exchangeRate="Number(exchangeRate)"
      />
      <LoadingText text="Activities Loading..." v-else />
    </div>
  </div>
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
