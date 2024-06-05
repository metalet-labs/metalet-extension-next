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

const mvcPath = ref(10001)
const error = ref<string>()
const customAddress = ref('')
const selectedMvcPath = ref(false)

const { words } = defineProps({
  words: {
    type: Array<string>,
    required: true,
  },
  mvcTypes: {
    type: Array<number>,
    required: true,
  },
})

const emit = defineEmits(['preStep', 'nextStep', 'update:mvcTypes'])

const network = getNet()
const mnemonic = words.join(' ')
if (!mnemonic) {
  emit('preStep')
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
  if (newPath === prePath) {
    return
  }
  if (!newPath) {
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
  emit('nextStep')
}
</script>

<template>
  <div class="flex flex-col gap-6 w-82">
    <div class="flex items-center gap-3">
      <ArrowLeftIcon
        @click="!selectedMvcPath ? emit('preStep') : (selectedMvcPath = false)"
        class="cursor-pointer w-3.5"
      />
      <div class="text-2xl font-medium">MVC</div>
    </div>
    <div v-if="!selectedMvcPath">
      <div class="h-[416px]">
        <div class="text-xs font-semibold">Choose MVC Address Type</div>
        <p class="text-xs text-gray-primary mt-2">If you're unsure what this is, keep the default.</p>
        <div
          class="flex items-center justify-between bg-gray-secondary rounded-lg p-4 cursor-pointer mt-[22px]"
          @click="mvcPath = 10001"
        >
          <div class="flex flex-col gap-y-1.5 w-64">
            <div class="text-sm font-semibold">Default</div>
            <div class="text-xs">It's default strategy of MVC Address. Using "m/44'/10001'/0'" as derivation path.</div>
          </div>
          <SuccessIcon v-if="mvcPath === 10001" class="w-5 h-5" />
          <div v-else class="w-4 h-4 border border-[#C5C5C5] rounded-full"></div>
        </div>
        <div
          class="flex items-center justify-between bg-gray-secondary rounded-lg p-4 cursor-pointer mt-4"
          @click="mvcPath = 236"
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
        Next
      </Button>
    </div>
    <div class="flex flex-col gap-4" v-else>
      <div class="flex flex-col gap-6 h-[416px]">
        <div class="flex flex-col gap-3">
          <div class="text-xs font-semibold">Customize your MVC address</div>
          <div class="flex items-center justify-between gap-5">
            <template v-if="mvcPath !== 10001">
              <div class="text-sm tracking-wide">
                <span>m/44'/</span>
                <input type="text" class="pit-input mx-2 w-16" v-model="mvcPath" />
                <span>'/0'</span>
              </div>
              <DeleteIcon class="cursor-pointer" v-if="false" />
            </template>
            <div v-else class="text-xs font-semibold">Address for MVC</div>
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
        <div class="flex gap-2 items-center justify-center cursor-pointer" v-if="false">
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
