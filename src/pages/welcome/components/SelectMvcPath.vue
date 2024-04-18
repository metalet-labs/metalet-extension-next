<script lang="ts" setup>
import { Button } from '@/components'
import { getNet } from '@/lib/network'
import { ref, watch, computed } from 'vue'
import { useDebounce } from '@vueuse/core'
import Avatar from '@/components/Avatar.vue'
import AddIcon from '@/assets/icons-v3/add.svg'
import Loading from '@/components/LoadingIcon.vue'
import { useBalanceQuery } from '@/queries/balance'
import { useMVCAssetsQuery } from '@/queries/tokens'
import DeleteIcon from '@/assets/icons-v3/delete.svg'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
import { MvcWallet, AddressType, CoinType } from '@metalet/utxo-wallet-service'
import { useExchangeRatesQuery, useAllExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'

const mvcPath = ref('236')
const error = ref<string>()
const isCustom = ref(false)
const mvcAddress = ref('')
const customAddress = ref('')
const emit = defineEmits(['preStep', 'nextStep'])

const { words, mvcTypes } = defineProps({
  words: {
    type: Array<string>,
    required: true,
  },
  mvcTypes: {
    type: Array<number>,
    required: true,
  },
})

const network = getNet()
const mnemonic = words.join(' ')
if (!mnemonic) {
  emit('preStep')
}

const { isLoading: ftRatesLoading, data: ftRates } = useAllExchangeRatesQuery(ref(CoinCategory.MetaContract), {
  enabled: computed(() => !!mvcAddress.value),
})

const { isLoading: spaceRateLoading, data: spaceRate } = useExchangeRatesQuery(ref('SPACE'), ref(CoinCategory.Native), {
  enabled: computed(() => !!mvcAddress.value),
})

const mvcWallet = new MvcWallet({
  network,
  mnemonic,
  addressIndex: 0,
  coinType: CoinType.MVC,
  addressType: AddressType.LegacyMvc,
})

mvcAddress.value = mvcWallet.getAddress()

const { isLoading: mvcBalanceLoading, data: mvcBalance } = useBalanceQuery(mvcAddress, ref('SPACE'), {
  enabled: computed(() => !!mvcAddress.value),
})

const { isLoading: mvcAssetsLoading, data: mvcAssets } = useMVCAssetsQuery(mvcAddress, {
  enabled: computed(() => !!mvcAddress.value),
})

const mvcLoading = computed(() => {
  return mvcBalanceLoading.value || spaceRateLoading.value || mvcAssetsLoading.value || ftRatesLoading.value
})

//TODO: USD Aggregation Hook
const mvcSpaceUSD = computed(() => {
  if (mvcBalance.value && spaceRate.value?.price !== undefined) {
    return (mvcBalance.value.total / 1e8) * spaceRate.value.price
  }
  return 0
})

const mvcftUSD = computed(() => {
  let total = 0
  if (ftRates.value && mvcAssets.value) {
    Object.entries(ftRates.value).forEach(([symbol, rate = 0]) => {
      const asset = mvcAssets.value.find((a) => a.symbol === symbol)
      if (asset && asset.balance) {
        total += rate * (asset.balance.total / 10 ** asset.decimal)
      }
    })
  }
  return total
})

const mvcUSD = computed(() => {
  return `$${(mvcSpaceUSD.value + mvcftUSD.value).toFixed(2)}`
})

const bsvWallet = new MvcWallet({
  network,
  mnemonic,
  addressIndex: 0,
  coinType: CoinType.BSV,
  addressType: AddressType.LegacyMvcCustom,
})

customAddress.value = bsvWallet.getAddress()

// TODO: balance query optimization
const { isLoading: customBalanceLoading, data: customBalance } = useBalanceQuery(customAddress, ref('SPACE'), {
  enabled: computed(() => !!customAddress.value),
})

// TODO: balance query optimization
const { isLoading: customAssetsLoading, data: customAssets } = useMVCAssetsQuery(customAddress, {
  enabled: computed(() => !!customAddress.value),
})

const customLoading = computed(() => {
  return customBalanceLoading.value || spaceRateLoading.value || customAssetsLoading.value || ftRatesLoading.value
})

//TODO: USD Aggregation Hook
const customSpaceUSD = computed(() => {
  let total = 0
  if (customBalance.value && spaceRate.value?.price !== undefined) {
    total = (customBalance.value.total / 1e8) * spaceRate.value.price
  }
  if (total > 0) {
    isCustom.value = true
  }
  return total
})

const customftUSD = computed(() => {
  let total = 0
  if (ftRates.value && customAssets.value) {
    Object.entries(ftRates.value).forEach(([symbol, rate = 0]) => {
      const asset = customAssets.value.find((a) => a.symbol === symbol)
      if (asset && asset.balance) {
        total += rate * (asset.balance.total / 10 ** asset.decimal)
      }
    })
  }
  if (total > 0) {
    isCustom.value = true
  }
  return total
})

const customUSD = computed(() => {
  return `$${(customSpaceUSD.value + customftUSD.value).toFixed(2)}`
})

const debouncedMvcPath = useDebounce(mvcPath, 300)

watch(debouncedMvcPath, (newPath, prePath) => {
  if (newPath === '10001' || newPath === prePath) {
    return
  }
  if (!newPath) {
    error.value = 'Please enter a valid path.'
    return
  }
  try {
    const coinType = Number(newPath)
    const customWallet = new MvcWallet({
      network,
      mnemonic,
      addressIndex: 0,
      coinType,
      addressType: AddressType.LegacyMvcCustom,
    })
    customAddress.value = customWallet.getAddress()
  } catch (e) {
    error.value = 'Please enter a valid path.'
  }
})

const next = () => {
  if (isCustom.value) {
    mvcTypes.push(Number(mvcPath.value))
  }
  emit('nextStep')
}

watch(
  () => mvcPath.value,
  (newPath) => {
    if (newPath && mvcTypes.includes(Number(newPath))) {
      error.value = 'MVC path already exists. Please enter a other path.'
    } else {
      error.value = undefined
    }
  }
)
</script>

<template>
  <div class="flex flex-col gap-6 w-82">
    <div class="flex items-center gap-3">
      <ArrowLeftIcon @click="emit('preStep')" class="cursor-pointer" />
      <div class="text-2xl font-medium">MVC Management</div>
    </div>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-6 h-[416px]">
        <div class="flex flex-col gap-3">
          <div class="text-xs font-semibold">MVC Default</div>
          <div class="flex items-center gap-2 bg-gray-secondary p-3 rounded-lg text-xs">
            <Avatar :id="mvcAddress" />
            <div class="flex flex-col gap-1 grow overflow-hidden">
              <div class="truncate">{{ mvcAddress }}</div>
              <div class="text-gray-primary" v-if="!mvcLoading">{{ mvcUSD }}</div>
              <Loading v-else />
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3" v-if="isCustom">
          <div class="flex items-center justify-between gap-5">
            <div class="text-xs font-semibold">MVC Custom</div>
            <div class="text-sm tracking-wide">
              <span>m/44'/</span>
              <input type="text" class="pit-input mx-2 w-16" v-model="mvcPath" />
              <span>'/0'</span>
            </div>
            <DeleteIcon class="cursor-pointer" @click="isCustom = false" />
          </div>
          <div class="flex items-center gap-2 bg-gray-secondary p-3 rounded-lg text-xs">
            <Avatar :id="customAddress" />
            <div class="flex flex-col gap-1 grow overflow-hidden">
              <div class="truncate">{{ customAddress }}</div>
              <div class="text-gray-primary" v-if="!customLoading">{{ customUSD }}</div>
              <Loading v-else />
            </div>
          </div>
        </div>
        <div class="flex gap-2 items-center justify-center cursor-pointer" v-else @click="isCustom = true">
          <AddIcon class="w-6 h-6" />
          <span class="text-xs font-medium">Add Custom Path</span>
        </div>
      </div>

      <Button
        @click="next"
        type="primary"
        :disabled="!mvcPath || !!error"
        :class="['w-61.5 mt-15 mx-auto', { 'cursor-not-allowed opacity-50': !mvcPath || !!error }]"
      >
        Next
      </Button>

      <!-- error -->
      <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>
