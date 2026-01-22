<script lang="ts" setup>
import Decimal from 'decimal.js'
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import { truncateStr } from '@/lib/formatters'
import AssetLogo from '@/components/AssetLogo.vue'
import BTCBalance from '@/components/BTCBalance.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { useBalanceQuery } from '@/queries/balance'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import { useOfficeGenesisStore } from '@/stores/FtTokenStore'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'
import { type Asset, getTagInfo, type Tag, BRC20Asset, MetaContractAsset, MRC20Asset } from '@/data/assets'
import { BTCBalanceV2 } from '@/queries/types/balance'
import DogeLogo from '@/assets/icons-v3/doge.svg?url'

const props = defineProps<{
  address: string
  coinCategory: CoinCategory
  asset: Asset | BRC20Asset | MetaContractAsset | MRC20Asset
}>()

const tag = ref<Tag>()
const asset = computed(() => props.asset)
const address = computed(() => props.address)
const coinCategory = computed(() => props.coinCategory)

const { t } = useI18n()
const { getIcon } = useIconsStore()
const { isOfficeGenesis } = useOfficeGenesisStore()

const icon = computed(() => {
  // Use local DOGE logo if symbol is DOGE
  if (props.asset.symbol === 'DOGE') {
    return DogeLogo
  }
  return (
    (asset.value as MRC20Asset)?.icon ||
    getIcon(
      props.coinCategory,
      props.coinCategory === CoinCategory.MetaContract ? (props.asset as MetaContractAsset).genesis : props.asset.symbol
    ) ||
    ''
  )
})

if (props.asset?.contract) {
  tag.value = getTagInfo(props.asset.contract)
} else if (props.asset.symbol === 'SPACE') {
  tag.value = { bg: 'rgba(247,147,26,0.2)', color: '#F7931A', name: t('Common.BitcoinSideChain') }
} else if (props.asset.symbol === 'DOGE') {
  tag.value = { bg: 'rgba(194,166,51,0.2)', color: '#C2A633', name: t('Common.BitcoinSideChain') }
}

const balanceEnabled = computed(() => !!address.value && !!asset.value.symbol && !asset.value.balance)
const { isLoading: isBalanceLoading, data: balance } = useBalanceQuery(address, ref(asset.value.symbol), {
  enabled: balanceEnabled,
})

const rateEnabled = computed(() => !!address && !!asset.value.symbol)
const { isLoading: isExchangeRateLoading, data: exchangeRate } = useExchangeRatesQuery(
  ref(
    coinCategory.value === CoinCategory.MRC20
      ? `${(asset.value as MRC20Asset).mrc20Id}/${asset.value.symbol}`
      : asset.value.symbol
  ),
  ref(coinCategory),
  {
    enabled: rateEnabled,
  }
)

const assetPrice = computed(() => {
  if (asset.value?.balance) {
    // 对于 MRC20，使用 confirmed + pendingIn - pendingOut
    if (coinCategory.value === CoinCategory.MRC20) {
      const mrc20Balance = asset.value.balance as any
      const displayBalance = mrc20Balance.confirmed
        .add(mrc20Balance.pendingIn || new Decimal(0))
        .sub(mrc20Balance.pendingOut || new Decimal(0))
      return `${displayBalance.dividedBy(10 ** asset.value.decimal).toFixed()} ${asset.value.symbol}`
    }
    return `${asset.value.balance.total.dividedBy(10 ** asset.value.decimal).toFixed()} ${asset.value.symbol}`
  } else if (balance.value) {
    return `${balance.value.total.dividedBy(10 ** asset.value.decimal).toFixed()} ${asset.value.symbol}`
  }
  return `-- ${asset.value.symbol}`
})

// 获取 MRC20 的 pending 余额用于显示
const mrc20Pending = computed(() => {
  if (coinCategory.value !== CoinCategory.MRC20 || !asset.value?.balance) {
    return { pendingIn: '', pendingOut: '' }
  }
  const mrc20Balance = asset.value.balance as any
  const decimal = asset.value.decimal
  const pendingIn = mrc20Balance.pendingIn?.toNumber() || 0
  const pendingOut = mrc20Balance.pendingOut?.toNumber() || 0
  return {
    pendingIn: pendingIn ? new Decimal(pendingIn).dividedBy(10 ** decimal).toFixed() : '',
    pendingOut: pendingOut ? new Decimal(pendingOut).dividedBy(10 ** decimal).toFixed() : '',
  }
})

const loading = computed(() => isBalanceLoading.value && isExchangeRateLoading.value)

const assetUSD = computed(() => {
  if (loading.value) {
    return
  }
  const usdRate = new Decimal(exchangeRate.value?.price || 0)
  if (asset.value?.balance) {
    const balanceInStandardUnit = asset.value.balance.total.dividedBy(10 ** asset.value.decimal)
    return usdRate.mul(balanceInStandardUnit)
  } else if (balance.value && exchangeRate.value) {
    const balanceInStandardUnit = balance.value.total.dividedBy(10 ** asset.value.decimal)
    return usdRate.mul(balanceInStandardUnit)
  }
})

watch(
  assetUSD,
  (_assetUSD) => {
    if (_assetUSD) {
      updateAsset({ chain: asset.value.chain, name: asset.value.symbol, value: _assetUSD.toNumber() })
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="group relative transition hover:z-10">
    <div class="flex gap-2 cursor-pointer items-center justify-between rounded-full py-3">
      <div class="flex flex-shrink-0 items-center gap-x-3">
        <AssetLogo :chain="asset.chain" logo-size="size-4" class="size-10" :symbol="asset.symbol" :logo="icon"
          :type="asset.isNative || coinCategory === CoinCategory.MRC20 ? undefined : 'network'" />
        <div class="flex flex-col gap-y-1 items-start">
          <div :title="asset.tokenName" class="flex items-center gap-x-0.5 text-base">
            <span :title="asset.tokenName"
              :class="['truncate max-w-40', { 'max-w-24 truncate overflow-hidden': coinCategory === 'BRC-20' }]">
              {{ truncateStr(asset.tokenName, 5) }}
            </span>
            <CheckBadgeIcon class="h-4 w-4 shrink-0 text-blue-500"
              v-if="(asset as MetaContractAsset)?.genesis && isOfficeGenesis((asset as MetaContractAsset).genesis)" />
          </div>

          <div v-if="tag" :style="[`background-color:${tag.bg};color:${tag.color};`]"
            :class="['px-1.5', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'scale-75', 'origin-left']">
            {{ tag.name }}
          </div>
        </div>
      </div>

      <div class="flex grow overflow-hidden flex-col items-end text-xs gap-y-1">
        <div class="w-full flex flex-col items-end">
          <div class="flex items-center gap-x-1 text-black-primary text-sm truncate max-w-full" :title="assetPrice">
            <span>{{ assetPrice }}</span>
            <span v-if="mrc20Pending.pendingIn" class="text-green-500 text-xs">+{{ mrc20Pending.pendingIn }}</span>
            <span v-if="mrc20Pending.pendingOut" class="text-orange-500 text-xs">-{{ mrc20Pending.pendingOut }}</span>
          </div>
          <div class="text-xs text-gray-primary">
            <span v-if="assetUSD">
              ≈ {{ `$${assetUSD.toDecimalPlaces(2, Decimal.ROUND_FLOOR).toNumber().toFixed(2)}` }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="coinCategory === CoinCategory.Native && asset?.symbol === 'BTC'">
      <BTCBalance :balance="balance?.total" :safe-balance="(balance as BTCBalanceV2)?.safeBalance" />
    </div>
    <div v-if="asset?.contract === CoinCategory.BRC20"
      class="w-full flex items-center justify-around bg-[#F9FBFC] py-3 rounded-lg">
      <div class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">{{ (asset as BRC20Asset).balance?.transferableBalance }}</span>
        <span class="text-[#909399]">{{ $t('Common.Transferable') }}</span>
      </div>
      <div class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">{{ (asset as BRC20Asset).balance?.availableBalanceSafe }}</span>
        <span class="text-[#909399]">{{ $t('Common.Available') }}</span>
      </div>
      <div v-if="(asset as BRC20Asset).balance?.availableBalanceUnSafe"
        class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">{{ (asset as BRC20Asset).balance?.availableBalanceUnSafe }}</span>
        <span class="text-[#909399]">{{ $t('Common.Pending') }}</span>
      </div>
    </div>
    <div v-else-if="asset?.contract === CoinCategory.MRC20 && (asset.balance?.unconfirmed.toNumber() || (asset as MRC20Asset).balance?.pendingIn?.toNumber() || (asset as MRC20Asset).balance?.pendingOut?.toNumber())"
      class="w-full flex items-center justify-around bg-[#F9FBFC] py-3 rounded-lg">
      <div class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">
          {{ asset.balance?.confirmed.dividedBy(10 ** asset.decimal).toNumber() }}
        </span>
        <span class="text-[#909399]">{{ $t('Common.Confirmed') }}</span>
      </div>
      <div v-if="asset.balance?.unconfirmed.toNumber()" class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">
          {{ asset.balance?.unconfirmed.dividedBy(10 ** asset.decimal).toNumber() }}
        </span>
        <span class="text-[#909399]">{{ $t('Common.Unconfirmed') }}</span>
      </div>
      <div v-if="(asset as MRC20Asset).balance?.pendingIn?.toNumber()" class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-green-500 truncate">
          +{{ (asset as MRC20Asset).balance?.pendingIn?.dividedBy(10 ** asset.decimal).toNumber() }}
        </span>
        <span class="text-[#909399]">{{ $t('Common.PendingIn') }}</span>
      </div>
      <div v-if="(asset as MRC20Asset).balance?.pendingOut?.toNumber()" class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-orange-500 truncate">
          -{{ (asset as MRC20Asset).balance?.pendingOut?.dividedBy(10 ** asset.decimal).toNumber() }}
        </span>
        <span class="text-[#909399]">{{ $t('Common.PendingOut') }}</span>
      </div>
    </div>
  </div>
</template>
