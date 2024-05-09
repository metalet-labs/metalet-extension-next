<script lang="ts" setup>
import Decimal from 'decimal.js'
import { computed, ref, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import { calcBalance } from '@/lib/formatters'
import { useRoute, useRouter } from 'vue-router'
import { SymbolTicker } from '@/lib/asset-symbol'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { useBalanceQuery } from '@/queries/balance'
import { WalletsStore } from '@/stores/WalletStore'
import Activities from './components/Activities.vue'
import FilterIcon from '@/assets/icons-v3/filter.svg'
import ToggleIcon from '@/assets/icons-v3/toggle.svg'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { getTags, BTCAsset, MVCAsset } from '@/data/assets'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
import { LoadingText, SwitchAddressModal } from '@/components'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const isOpen = ref(false)
const route = useRoute()
const router = useRouter()

const address = computed(() => route.params.address as string)
const symbol = ref<SymbolTicker>(route.params.symbol as SymbolTicker)

const { getIcon } = useIconsStore()
const icon = computed(() => getIcon(CoinCategory.Native, route.params.symbol as SymbolTicker) || '')

const asset = computed(() => {
  if (symbol.value === 'BTC') {
    return BTCAsset
  }
  if (symbol.value === 'SPACE') {
    return MVCAsset
  }
})

const balaceEnabled = computed(() => {
  if (asset.value) {
    return !!address.value && !!symbol.value && !asset.value.balance
  }
  return false
})

const { isLoading, data: balance } = useBalanceQuery(address, symbol, { enabled: balaceEnabled })

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
  ref(CoinCategory.Native),
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

const toSend = () => {
  router.push({
    name: 'send',
    params: {
      symbol: symbol.value,
      address: address.value,
    },
  })
}

const chainWallets = ref()
WalletsStore.getAccountChainWallets().then((_chainWallets) => {
  chainWallets.value = _chainWallets[asset.value!.chain]!.map((wallet) => ({
    address: wallet.getAddress(),
    addressType: wallet.getAddressType(),
  }))
})

const toReceive = () => {
  router.push(`/wallet/receive/${symbol.value}/${address.value}`)
}
</script>

<template>
  <div class="flex flex-col items-center space-y-6 w-full" v-if="asset">
    <div class="w-full h-15 -my-3 flex items-center justify-between">
      <ArrowLeftIcon class="w-3.5 cursor-pointer" @click="router.push('/wallet')" />
      <span>{{ symbol }}</span>
      <div class="w-3.5 cursor-pointer" @click="isOpen = true" title="Set Default Address" v-if="asset.chain === 'btc'">
        <ToggleIcon />
      </div>
      <div v-else></div>
      <SwitchAddressModal v-model:show="isOpen" :asset="asset" />
    </div>
    <div class="flex flex-col items-center">
      <AssetLogo :logo="icon" :chain="asset.chain" :symbol="asset.symbol" type="network" class="w-15" />

      <div class="mt-3 text-2xl">
        <span v-if="balance">{{ calcBalance(balance.total, asset.decimal, asset.symbol) }}</span>
        <span v-else>-- {{ asset.symbol }}</span>
        <span v-if="assetUSD !== undefined" class="text-gray-primary ml-2">
          ≈ ${{ assetUSD?.toNumber().toFixed(2) }}
        </span>
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

    <div class="flex items-center justify-center gap-x-2">
      <button @click="toSend" class="btn-blue-light">
        <ArrowUpIcon class="w-3" />
        <span>Send</span>
      </button>
      <button @click="toReceive" class="btn-blue-primary">
        <ArrowDownIcon class="w-3" />
        <span>Receive</span>
      </button>
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
      <Activities
        class="mt-8 self-stretch"
        :asset="asset"
        :exchangeRate="Number(exchangeRate)"
        :address="address"
        :coinCategory="CoinCategory.Native"
      />
    </div>
  </div>
  <LoadingText v-else text="Asset Loading..." />
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

div[role='tablist'] {
  @apply p-0 h-auto;
}

button[role='tab'] {
  @apply flex flex-col items-center px-0 py-4 rounded-none border-b-2 border-transparent;
}

button[role='tab'][aria-selected='true'] {
  @apply border-blue-primary;
}

div[role='tabpanel'] {
  @apply px-3 py-4 mt-0;
}
</style>
