<script lang="ts" setup>
import Decimal from 'decimal.js'
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
import SuccessIcon from '@/assets/icons-v3/success-checked.svg'
import { MvcWallet, AddressType, CoinType } from '@metalet/utxo-wallet-service'
import { useExchangeRatesQuery, useAllExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'

const MVC_PATH = 10001
const isCustom = ref(false)
const error = ref<string>()
const mvcPath = ref(MVC_PATH)
const customAddress = ref('')
const selectedMvcPath = ref(false)

const props = defineProps({
  words: {
    type: Array<string>,
    required: true,
  },
  mvcTypes: {
    type: Array<number>,
    required: true,
  },
})

watch(
  props.mvcTypes,
  (mvcTypes) => {
    mvcPath.value = mvcTypes?.[0] || MVC_PATH
    isCustom.value = mvcTypes.includes(MVC_PATH)
  },
  { immediate: true }
)

const emit = defineEmits(['close', 'update:mvcTypes'])

const network = getNet()
const mnemonic = props.words.join(' ')
if (!mnemonic) {
  emit('close')
}

const { isLoading: ftRatesLoading, data: ftRates } = useAllExchangeRatesQuery(ref(CoinCategory.MetaContract), {
  enabled: computed(() => !!customAddress.value),
})

const { isLoading: spaceRateLoading, data: spaceRate } = useExchangeRatesQuery(ref('SPACE'), ref(CoinCategory.Native), {
  enabled: computed(() => !!customAddress.value),
})

const customWallet = new MvcWallet({
  network,
  mnemonic,
  addressIndex: 0,
  coinType: CoinType.MVC,
  addressType: AddressType.Legacy,
})

customAddress.value = customWallet.getAddress()

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
  let total = new Decimal(0)
  if (customBalance.value && spaceRate.value?.price !== undefined) {
    total = total.add(customBalance.value.total.dividedBy(1e8).mul(spaceRate.value.price))
  }
  return total
})

const customftUSD = computed(() => {
  let total = new Decimal(0)
  if (ftRates.value && customAssets.value) {
    Object.entries(ftRates.value).forEach(([symbol, rate = 0]) => {
      const asset = customAssets.value.find((a) => a.symbol === symbol)
      if (asset && asset.balance) {
        total = total.add(asset.balance.total.dividedBy(10 ** asset.decimal).mul(rate))
      }
    })
  }
  return total
})

const customUSD = computed(() => {
  return `$${customSpaceUSD.value.add(customftUSD.value).toFixed(2)}`
})

const debouncedMvcPath = useDebounce(mvcPath, 300)

watch(debouncedMvcPath, (newPath, prePath) => {
  error.value = undefined
  if (newPath === prePath) {
    return
  }
  if (newPath === undefined || newPath < 0) {
    error.value = 'Please enter a valid path.'
    return
  }
  try {
    const customWallet = new MvcWallet({
      network,
      mnemonic,
      addressIndex: 0,
      coinType: newPath,
      addressType: AddressType.LegacyMvc,
    })
    customAddress.value = customWallet.getAddress()
  } catch (e) {
    error.value = 'Please enter a valid path.'
  }
})

const next = () => {
  emit('update:mvcTypes', [mvcPath.value])
  emit('close')
}
</script>

<template>
  <div class="flex flex-col gap-6 w-82">
    <div class="flex items-center gap-3">
      <ArrowLeftIcon
        @click="!selectedMvcPath ? emit('close') : (selectedMvcPath = false)"
        class="cursor-pointer w-3.5"
      />
      <div class="text-2xl font-medium">Choose MVC Address</div>
    </div>
    <div v-if="!selectedMvcPath">
      <div class="h-[416px]">
        <div class="text-xs font-semibold">Choose MVC(Bitcoin sidechain) Address Type</div>
        <p class="text-xs text-gray-primary mt-2">If you're unsure what this is, keep the default.</p>
        <div
          class="flex items-center justify-between bg-gray-secondary rounded-lg p-4 cursor-pointer mt-[22px]"
          @click="
            () => {
              mvcPath = 10001
              isCustom = false
            }
          "
        >
          <div class="flex flex-col gap-y-1.5 w-64">
            <div class="text-sm font-semibold">Default</div>
            <div class="text-xs">
              It's default strategy of MVC(Bitcoin sidechain) Address. Using "m/44'/10001'/0'" as derivation path.
            </div>
          </div>
          <SuccessIcon v-if="mvcPath === 10001" class="w-5 h-5" />
          <div v-else class="w-4 h-4 border border-[#C5C5C5] rounded-full"></div>
        </div>
        <div
          class="flex items-center justify-between bg-gray-secondary rounded-lg p-4 cursor-pointer mt-4"
          @click="
            () => {
              mvcPath = 236
              isCustom = true
            }
          "
        >
          <div class="flex flex-col gap-y-1.5 w-64">
            <div class="text-sm font-semibold">Custom</div>
            <div class="text-xs">
              The custom option is mostly used for backward compatibility. Make sure you know what a derivation path is
              if you choose this.
            </div>
          </div>
          <SuccessIcon v-if="mvcPath !== 10001" class="w-5 h-5" />
          <div v-else class="w-4 h-4 border border-[#C5C5C5] rounded-full"></div>
        </div>
      </div>
      <Button
        type="primary"
        @click="selectedMvcPath = true"
        :disabled="!mvcPath || !!error"
        :class="['w-61.5 mt-15 mx-auto', { 'cursor-not-allowed opacity-50': !mvcPath || !!error }]"
      >
        {{ $t('Common.Next') }}
      </Button>
    </div>
    <div class="flex flex-col gap-4" v-else>
      <div class="flex flex-col gap-6 h-[416px]">
        <div class="flex flex-col gap-3">
          <template v-if="isCustom">
            <div class="text-xs font-semibold">Customize your MVC(Bitcoin sidechain) address</div>
            <div class="flex items-center justify-between gap-5">
              <div class="text-sm tracking-wide">
                <span>m/44'/</span>
                <input type="number" class="pit-input mx-2 w-16" v-model="mvcPath" min="0" />
                <span>'/0'</span>
              </div>
              <DeleteIcon class="cursor-pointer" v-if="false" />
            </div>
          </template>
          <div v-else class="text-xs font-semibold">Address for MVC(Bitcoin sidechain)</div>
          <div class="flex items-center gap-2 bg-gray-secondary p-3 rounded-lg text-xs">
            <Avatar :id="customAddress" />
            <div class="flex flex-col gap-1 grow overflow-hidden">
              <div class="truncate">{{ customAddress }}</div>
              <div class="text-gray-primary" v-if="!customLoading">{{ customUSD }}</div>
              <Loading v-else />
            </div>
          </div>
        </div>
        <div class="flex gap-2 items-center justify-center cursor-pointer" v-if="false">
          <AddIcon class="w-6 h-6" />
          <span class="text-xs font-medium">Add Custom Path</span>
        </div>
      </div>

      <Button
        @click="next"
        type="primary"
        :disabled="mvcPath === undefined || !!error"
        :class="['w-61.5 mt-15 mx-auto', { 'cursor-not-allowed opacity-50': mvcPath === undefined || !!error }]"
      >
        {{ $t('Common.Confirm') }}
      </Button>

      <!-- error -->
      <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  /* display: none; <- Crashes Chrome on hover */
  -webkit-appearance: none;
  margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

input[type='number'] {
  -moz-appearance: textfield; /* Firefox */
}
</style>
