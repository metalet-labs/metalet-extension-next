<script lang="ts" setup>
import Decimal from 'decimal.js'
import { getTags } from '@/data/assets'
import { LoadingText } from '@/components'
import { computed, ref, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import CopyIcon from '@/components/Copy.vue'
import { useRoute, useRouter } from 'vue-router'
import AssetLogo from '@/components/AssetLogo.vue'
import Activities from './components/Activities.vue'
import { PencilIcon } from '@heroicons/vue/20/solid'
import { Chain } from '@metalet/utxo-wallet-service'
import FilterIcon from '@/assets/icons-v3/filter.svg'
import { useMRC20DetailQuery } from '@/queries/mrc20'
import { CoinCategory, useExchangeRatesQuery } from '@/queries/exchange-rates'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'
import TeleportIcon from '@/assets/icons-v3/teleport.svg'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { calcBalance, truncateStr } from '@/lib/formatters'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const route = useRoute()
const router = useRouter()
const symbol = route.params.symbol as string
const mrc20Id = ref<string>(route.params.mrc20Id as string)
const address = computed(() => route.params.address as string)

// 多链支持
type SupportedChain = 'btc' | 'doge' | 'mvc'
const activeChain = ref<SupportedChain>('btc')
const { getAddress } = useChainWalletsStore()

// 各链地址
const btcAddress = getAddress(Chain.BTC)
const dogeAddress = getAddress(Chain.DOGE)
const mvcAddress = getAddress(Chain.MVC)

// 当前激活链的地址
const currentChainAddress = computed(() => {
  switch (activeChain.value) {
    case 'btc': return btcAddress.value
    case 'doge': return dogeAddress.value
    case 'mvc': return mvcAddress.value
    default: return btcAddress.value
  }
})

const { data: asset } = useMRC20DetailQuery(address, mrc20Id, {
  enabled: computed(() => !!address.value && !!mrc20Id.value),
})

// 各链 MRC20 数量（目前只有 btc 有数据，其他链默认为 0）
const chainBalances = computed(() => ({
  btc: asset.value?.balance?.total.toNumber() || 0,
  doge: 0, // 接口暂不支持
  mvc: 0,  // 接口暂不支持
}))

const balance = computed(() => {
  if (asset.value?.balance) {
    return asset.value.balance.total.toNumber()
  }
})

// 当前链的余额
const currentChainBalance = computed(() => {
  return chainBalances.value[activeChain.value]
})

const tags = getTags(CoinCategory.MRC20)

const rateEnabled = computed(() => !!address.value)
const { data: exchangeRate } = useExchangeRatesQuery(ref(`${mrc20Id.value}/${symbol}`), ref(CoinCategory.MRC20), {
  enabled: rateEnabled,
})

const assetUSD = computed(() => {
  const usdRate = new Decimal(exchangeRate.value?.price || 0)
  if (asset.value?.balance) {
    const balanceInStandardUnit = asset.value.balance.total.dividedBy(10 ** asset.value.decimal)
    return usdRate.mul(balanceInStandardUnit)
  }
})

const logo = computed(() => asset.value?.icon || '')

watch(assetUSD, (_assetUSD) => {
  if (asset.value && _assetUSD) {
    updateAsset({ chain: asset.value.chain, name: asset.value.tokenName, value: _assetUSD.toNumber() })
  }
})

const toMint = () => {
  router.push(`/wallet/mintMRC20/${asset.value!.tokenName}/${mrc20Id.value}/${address.value}`)
}

const toSend = () => {
  router.push({
    name: 'SendMRC20',
    params: {
      mrc20Id: mrc20Id.value,
      address: address.value,
      name: asset.value!.tokenName,
    },
  })
}

const toReceive = () => {
  router.push({
    path: `/wallet/receive/${CoinCategory.MRC20}/${symbol}/${currentChainAddress.value}`,
    query: {
      chain: activeChain.value,
    },
  })
}

const toTeleport = () => {
  router.push({
    name: 'TeleportMRC20',
    params: {
      mrc20Id: mrc20Id.value,
      name: asset.value!.tokenName,
      fromChain: activeChain.value,
    },
  })
}

// 切换链
const switchChain = (chain: SupportedChain) => {
  activeChain.value = chain
}

// 格式化链上余额显示
const formatChainBalance = (chain: SupportedChain) => {
  const bal = chainBalances.value[chain]
  if (!asset.value) return '0'
  return calcBalance(bal, asset.value.decimal, '')
}

// 支持的链列表
const supportedChains: SupportedChain[] = ['btc', 'doge', 'mvc']
</script>

<template>
  <div class="flex flex-col items-center space-y-6 w-full">
    <!-- Token 信息头部 - 横向排列 -->
    <div class="flex items-center justify-center gap-x-4 w-full">
      <AssetLogo :logo="logo" :chain="Chain.BTC" :symbol="symbol" type="network" class="w-12" logoSize="size-5" />
      <div class="flex flex-col">
        <div class="text-xl font-medium">
          <span v-if="asset?.balance" class="break-all">
            {{ calcBalance(asset.balance.confirmed.toNumber(), asset.decimal, '') }}
          </span>
          <span v-else>--</span>
          <span class="text-gray-primary ml-1">{{ symbol }}</span>
        </div>
        <div class="text-sm text-gray-primary" v-if="assetUSD !== undefined">
          ≈ ${{ assetUSD?.toNumber().toFixed(2) }}
        </div>
      </div>
      <div
        :key="tag.name"
        v-for="tag in tags"
        :style="`background-color:${tag.bg};color:${tag.color};`"
        :class="['px-1.5', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'self-start']"
      >
        {{ tag.name }}
      </div>
    </div>

    <!-- 多链 Tab -->
    <div class="flex items-center justify-center gap-x-2 w-full">
      <button
        v-for="chain in supportedChains"
        :key="chain"
        @click="switchChain(chain)"
        :class="[
          'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
          activeChain === chain 
            ? 'bg-blue-primary text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        <div class="flex flex-col items-center">
          <span class="uppercase">{{ chain }}</span>
          <span class="text-xs mt-0.5" :class="activeChain === chain ? 'text-blue-100' : 'text-gray-400'">
            {{ formatChainBalance(chain) }}
          </span>
        </div>
      </button>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-center gap-x-2">
      <button
        @click="toSend"
        :disabled="!currentChainBalance"
        :class="['btn-blue-light', { 'opacity-50 cursor-not-allowed': !currentChainBalance }]"
      >
        <ArrowUpIcon class="w-3" />
        <span>Send</span>
      </button>
      <button
        @click="toReceive"
        class="btn-blue-light"
      >
        <ArrowDownIcon class="w-3" />
        <span>Receive</span>
      </button>
      <button
        @click="toTeleport"
        :disabled="!currentChainBalance"
        :class="['btn-blue-primary', { 'opacity-50 cursor-not-allowed': !currentChainBalance }]"
      >
        <TeleportIcon class="w-3" />
        <span>Teleport</span>
      </button>
    </div>

    <!-- Token 详情 -->
    <div class="mt-4 flex flex-col items-center gap-y-2 w-full">
      <div class="flex items-center justify-between w-full">
        <div class="text-xs text-gray-500">Deployer</div>
        <div class="flex items-center gap-x-2">
          <AssetLogo
            :logo="asset?.deployAvatar"
            :symbol="asset?.deployName"
            class="size-5 shrink-0 rounded-full text-xs"
          />
          <span>{{ asset?.deployName || '--' }}</span>
        </div>
      </div>
      <div class="flex items-center justify-between w-full">
        <div class="text-xs text-gray-500">Token ID</div>
        <div class="flex items-center hover:text-blue-primary gap-x-2">
          <div class="text-base">{{ truncateStr(mrc20Id, 6) }}</div>
          <CopyIcon :text="mrc20Id" :title="$t('Copied')" />
        </div>
      </div>
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
        v-if="asset"
        :asset="asset"
        :exchangeRate="0"
        :icon="asset.icon"
        :address="address"
        :coinCategory="CoinCategory.MRC20"
      />
      <LoadingText text="Activities Loading..." v-else />
    </div>
  </div>
</template>

<style scoped lang="css">
.btn {
  @apply w-[100px] h-11 rounded-3xl flex items-center justify-center gap-x-2 text-sm;
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
