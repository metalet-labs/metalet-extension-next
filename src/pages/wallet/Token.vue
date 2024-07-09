<script lang="ts" setup>
import Decimal from 'decimal.js'
import { computed, ref } from 'vue'
import { getTags } from '@/data/assets'
import { LoadingText } from '@/components'
import { useRoute, useRouter } from 'vue-router'
import CopyIcon from '@/assets/icons-v3/copy.svg'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { useMVCTokenQuery } from '@/queries/tokens'
import Activities from './components/Activities.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import { toast } from '@/components/ui/toast/use-toast'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'
import { calcBalance, prettifyTokenGenesis } from '@/lib/formatters'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'

const route = useRoute()
const router = useRouter()

const symbol = route.params.symbol as string
const address = route.params.address as string
const genesis = route.params.genesis as string
const enabled = computed(() => !!address && !!symbol && !!genesis)

const { getIcon } = useIconsStore()
const icon = computed(() => getIcon(CoinCategory.MetaContract, route.params.genesis as string) || '')

const tags = getTags('MetaContract')

const { data: asset } = useMVCTokenQuery(ref(address), ref(genesis), { enabled })

const rateEnabled = computed(() => {
  if (asset.value) {
    return !!address && !!symbol
  }
  return false
})

const { isLoading: isExchangeRateLoading, data: exchangeRate } = useExchangeRatesQuery(
  ref(symbol),
  ref(CoinCategory.MetaContract),
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
      return usdRate.mul(balanceInStandardUnit)
    }
  }
})

const toSend = () => {
  router.push({
    name: 'send-token',
    params: { symbol, genesis, address },
  })
}
const toReceive = () => {
  router.push(`/wallet/receive/${CoinCategory.MetaContract}/${symbol}/${address}?chain=mvc&genesis=${genesis}`)
}

const copyGenesis = () => {
  navigator.clipboard.writeText(genesis)
  toast({ title: `Token Contract ID Copied`, toastType: 'success', description: genesis })
}
</script>

<template>
  <div class="flex flex-col items-center space-y-6 w-full h-full" v-if="asset">
    <div class="flex flex-col items-center">
      <AssetLogo :logo="icon" :chain="Chain.MVC" :symbol="symbol" type="network" class="w-15" />

      <div class="mt-3 text-2xl text-balance max-w-full text-center">
        <span v-if="asset?.balance" class="break-all">
          {{ calcBalance(asset.balance.total.toNumber(), asset.decimal, asset.symbol) }}
        </span>
        <span v-else>-- {{ symbol }}</span>
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

    <div class="mt-8 self-stretch" v-if="asset?.genesis">
      <div class="text-xs text-gray-500">Token Contract ID</div>
      <div class="flex items-center hover:text-blue-primary">
        <CheckBadgeIcon class="mr-1 h-5 w-5 text-blue-500" />
        <div class="text-base">{{ prettifyTokenGenesis(asset.genesis) }}</div>
        <CopyIcon class="ml-2 cursor-pointer w-[22px]" @click.stop="copyGenesis" />
      </div>
    </div>

    <Activities
      v-if="asset"
      :asset="asset"
      :exchangeRate="Number(exchangeRate)"
      :address="address"
      :coinCategory="CoinCategory.MetaContract"
    />
  </div>
  <LoadingText v-else text="Activities Loading..." />
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
