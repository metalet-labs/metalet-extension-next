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

// 查询 BTC 链上的 MRC20 详情
const { data: btcAsset } = useMRC20DetailQuery(computed(() => btcAddress.value), mrc20Id, {
  enabled: computed(() => !!btcAddress.value && !!mrc20Id.value),
})

// 查询 DOGE 链上的 MRC20 详情
const { data: dogeAsset } = useMRC20DetailQuery(computed(() => dogeAddress.value), mrc20Id, {
  enabled: computed(() => !!dogeAddress.value && !!mrc20Id.value),
})

// 合并后的资产信息（用于显示 token 基本信息）
const asset = computed(() => btcAsset.value || dogeAsset.value)

// 各链 MRC20 数量
const chainBalances = computed(() => ({
  btc: btcAsset.value?.balance?.total.toNumber() || 0,
  doge: dogeAsset.value?.balance?.total.toNumber() || 0,
  mvc: 0,  // 接口暂不支持
}))

// 合并后的总余额
const mergedBalance = computed(() => {
  const btcBalance = btcAsset.value?.balance
  const dogeBalance = dogeAsset.value?.balance
  
  if (!btcBalance && !dogeBalance) return null
  
  const decimal = asset.value?.decimal || 0
  
  return {
    confirmed: (btcBalance?.confirmed || new Decimal(0)).add(dogeBalance?.confirmed || new Decimal(0)),
    unconfirmed: (btcBalance?.unconfirmed || new Decimal(0)).add(dogeBalance?.unconfirmed || new Decimal(0)),
    total: (btcBalance?.total || new Decimal(0)).add(dogeBalance?.total || new Decimal(0)),
    pendingIn: (btcBalance?.pendingIn || new Decimal(0)).add(dogeBalance?.pendingIn || new Decimal(0)),
    pendingOut: (btcBalance?.pendingOut || new Decimal(0)).add(dogeBalance?.pendingOut || new Decimal(0)),
  }
})

const balance = computed(() => {
  return mergedBalance.value?.total.toNumber()
})

// 包含 pending 的总余额（confirmed + pendingIn - pendingOut）
const displayBalance = computed(() => {
  if (!mergedBalance.value) return null
  return mergedBalance.value.confirmed
    .add(mergedBalance.value.pendingIn || new Decimal(0))
    .sub(mergedBalance.value.pendingOut || new Decimal(0))
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
  if (mergedBalance.value && asset.value) {
    const balanceInStandardUnit = mergedBalance.value.total.dividedBy(10 ** asset.value.decimal)
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
      address: currentChainAddress.value,
      name: asset.value!.tokenName,
    },
    query: {
      chain: activeChain.value,
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

// 获取各链的 pending 余额
const getChainPending = (chain: SupportedChain) => {
  const assetData = chain === 'btc' ? btcAsset.value : chain === 'doge' ? dogeAsset.value : null
  if (!assetData?.balance || !asset.value) {
    return { pendingIn: '', pendingOut: '' }
  }
  const decimal = asset.value.decimal
  const pendingIn = assetData.balance.pendingIn?.toNumber() || 0
  const pendingOut = assetData.balance.pendingOut?.toNumber() || 0
  return {
    pendingIn: pendingIn ? calcBalance(pendingIn, decimal, '') : '',
    pendingOut: pendingOut ? calcBalance(pendingOut, decimal, '') : '',
  }
}

// 支持的链列表（MVC 暂不支持 mrc20-v2，暂时禁用）
const supportedChains: SupportedChain[] = ['btc', 'doge']

// 当前链的 source 参数（用于 activities 接口）
// MRC20 是跨链协议，所有链都需要传 source=mrc20-v2 来获取完整的活动记录
const currentSource = computed(() => {
  return 'mrc20-v2'
})
</script>

<template>
  <div class="flex flex-col items-center space-y-6 w-full">
    <!-- Token 信息头部 - 横向排列 -->
    <div class="flex items-center justify-center gap-x-4 w-full">
      <AssetLogo :logo="logo" :chain="Chain.BTC" :symbol="symbol" class="w-12" logoSize="size-5" />
      <div class="flex flex-col">
        <div class="text-xl font-medium">
          <span v-if="displayBalance" class="break-all">
            {{ calcBalance(displayBalance.toNumber(), asset?.decimal || 0, '') }}
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
          <div class="flex items-center gap-x-1 text-xs mt-0.5" :class="activeChain === chain ? 'text-blue-100' : 'text-gray-400'">
            <span>{{ formatChainBalance(chain) }}</span>
            <span v-if="getChainPending(chain).pendingIn" 
                  :class="activeChain === chain ? 'text-green-200' : 'text-green-500'">
              +{{ getChainPending(chain).pendingIn }}
            </span>
            <span v-if="getChainPending(chain).pendingOut" 
                  :class="activeChain === chain ? 'text-orange-200' : 'text-orange-500'">
              -{{ getChainPending(chain).pendingOut }}
            </span>
          </div>
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
        :address="currentChainAddress"
        :source="currentSource"
        :coinCategory="CoinCategory.MRC20"
        :chain="activeChain === 'doge' ? Chain.DOGE : Chain.BTC"
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
