<script lang="ts" setup>
import Decimal from 'decimal.js'
import { ref, computed, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import { UseImage } from '@vueuse/components'
import { useIconsStore } from '@/stores/IconsStore'
import { useBalanceQuery } from '@/queries/balance'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import { useOfficeGenesisStore } from '@/stores/FtTokenStore'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'
import { type Asset, getTagInfo, type Tag, BRC20Asset, FTAsset, MRC20Asset } from '@/data/assets'

const props = defineProps<{
  address: string
  coinCategory: CoinCategory
  asset: Asset | BRC20Asset | FTAsset
}>()

const asset = computed(() => props.asset)
const address = computed(() => props.address)
const coinCategory = computed(() => props.coinCategory)

const tag = ref<Tag>()

const { getIcon } = useIconsStore()
const { isOfficeGenesis } = useOfficeGenesisStore()

const icon = computed(
  () =>
    getIcon(
      props.coinCategory,
      props.coinCategory === CoinCategory.MetaContract ? (props.asset as FTAsset).genesis : props.asset.symbol
    ) ||
    (asset.value as MRC20Asset)?.icon ||
    ''
)

if (props.asset?.contract) {
  tag.value = getTagInfo(props.asset.contract)
} else if (props.asset.symbol === 'SPACE') {
  tag.value = { bg: 'rgba(247,147,26,0.2)', color: '#F7931A', name: 'Bitcoin sidechain' }
}

const balanceEnabled = computed(() => !!address.value && !!asset.value.symbol && !asset.value.balance)
const { isLoading: isBalanceLoading, data: balance } = useBalanceQuery(address, ref(asset.value.symbol), {
  enabled: balanceEnabled,
})

const rateEnabled = computed(() => !!address && !!asset.value.symbol)
const { isLoading: isExchangeRateLoading, data: exchangeRate } = useExchangeRatesQuery(
  ref(asset.value.symbol),
  ref(coinCategory),
  {
    enabled: rateEnabled,
  }
)

const assetPrice = computed(() => {
  if (asset.value?.balance) {
    return `${asset.value.balance.total.dividedBy(10 ** asset.value.decimal).toNumber()} ${asset.value.symbol}`
  } else if (balance.value) {
    return `${balance.value.total.dividedBy(10 ** asset.value.decimal).toNumber()} ${asset.value.symbol}`
  }
  return `-- ${asset.value.symbol}`
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
      <!-- left part -->
      <div class="flex flex-shrink-0 items-center gap-x-3">
        <UseImage :src="icon" class="h-10 w-10 shrink-0 rounded-full">
          <template #loading>
            <div class="h-10 w-10 shrink-0 text-center leading-10 rounded-full text-white text-base bg-btn-blue">
              {{ asset.symbol[0].toLocaleUpperCase() }}
            </div>
          </template>
          <template #error>
            <div class="h-10 w-10 shrink-0 text-center leading-10 rounded-full text-white text-base bg-btn-blue">
              {{ asset.symbol[0].toLocaleUpperCase() }}
            </div>
          </template>
        </UseImage>
        <div class="flex flex-col gap-y-1 items-start">
          <div :title="asset.tokenName" class="flex items-center gap-x-0.5 text-base">
            <span
              :title="asset.tokenName"
              :class="['truncate max-w-40', { 'max-w-24 truncate overflow-hidden': coinCategory === 'BRC-20' }]"
            >
              {{ asset.tokenName }}
            </span>
            <CheckBadgeIcon
              class="h-4 w-4 shrink-0 text-blue-500"
              v-if="(asset as FTAsset)?.genesis && isOfficeGenesis((asset as FTAsset).genesis)"
            />
          </div>

          <div
            v-if="tag"
            :style="[`background-color:${tag.bg};color:${tag.color};`]"
            :class="['px-1.5', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'scale-75', 'origin-left']"
          >
            {{ tag.name }}
          </div>
        </div>
      </div>

      <div class="flex grow overflow-hidden flex-col items-end text-xs gap-y-1">
        <div class="w-full flex flex-col items-end">
          <div class="text-black-primary text-sm truncate max-w-full" :title="assetPrice">
            {{ assetPrice }}
          </div>
          <div class="text-xs text-gray-primary">
            <span v-if="assetUSD">
              <!-- TODO： put into utils -->
              {{ `$${assetUSD.toDecimalPlaces(2, Decimal.ROUND_FLOOR).toNumber().toFixed(2)}` }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="asset?.contract === CoinCategory.BRC20"
      class="w-full flex items-center justify-around bg-[#F9FBFC] py-3 rounded-lg"
    >
      <div class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">{{ (asset as BRC20Asset).balance?.transferableBalance }}</span>
        <span class="text-[#909399]">Transferable</span>
      </div>
      <div class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">{{ (asset as BRC20Asset).balance?.availableBalanceSafe }}</span>
        <span class="text-[#909399]">Available</span>
      </div>
      <div
        v-if="(asset as BRC20Asset).balance?.availableBalanceUnSafe"
        class="text-xs flex flex-col gap-1 items-center justify-between w-full"
      >
        <span class="text-black-primary truncate">{{ (asset as BRC20Asset).balance?.availableBalanceUnSafe }}</span>
        <span class="text-[#909399]">Available(pending)</span>
      </div>
    </div>
    <div
      v-else-if="asset?.contract === CoinCategory.MRC20 && asset.balance?.unconfirmed.toNumber()"
      class="w-full flex items-center justify-around bg-[#F9FBFC] py-3 rounded-lg"
    >
      <div class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">
          {{ asset.balance?.confirmed.dividedBy(10 ** asset.decimal).toNumber() }}
        </span>
        <span class="text-[#909399]">Confirmed</span>
      </div>
      <div class="text-xs flex flex-col gap-1 items-center justify-between w-full">
        <span class="text-black-primary truncate">
          {{ asset.balance?.unconfirmed.dividedBy(10 ** asset.decimal).toNumber() }}
        </span>
        <span class="text-[#909399]">Unconfirmed</span>
      </div>
    </div>
  </div>
</template>
