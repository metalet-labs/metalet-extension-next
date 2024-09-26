<script setup lang="ts">
import Decimal from 'decimal.js'
import { type Asset } from '@/data/assets'
import { computed, watch, ref } from 'vue'
import { calcBalance } from '@/lib/formatters'
import RunesTokenIcon from './RunesTokenIcon.vue'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { SWAP_THRESHOLD_AMOUNT } from '@/data/constants'
import { Loader2Icon, EraserIcon, AlertCircleIcon } from 'lucide-vue-next'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'

const props = defineProps({
  disabled: {
    type: Boolean,
    required: false,
  },
  side: {
    type: String,
    required: true,
    validator: (side: string) => ['pay', 'receive'].includes(side),
  },
  asset: {
    type: Object as () => Asset,
    required: false,
  },
  coinCategory: {
    type: String as () => CoinCategory,
    required: true,
  },
  calculating: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'hasEnough',
  'notEnough',
  'becameSource',
  'amountCleared',
  'amountEntered',
  'update:symbol',
  'lessThanThreshold',
])

const asset = computed(() => props.asset)
const coinCategory = ref(props.coinCategory)
const balance = computed(() => props.asset?.balance)
const symbol = computed(() => props.asset?.symbol || '--')

const { getIcon } = useIconsStore()
const icon = computed(() => {
  if (asset.value) {
    return asset.value.icon || getIcon(coinCategory.value, asset.value.symbol) || ''
  }
})

const { data: exchangeRate } = useExchangeRatesQuery(symbol, coinCategory, {
  enabled: computed(() => {
    return !!symbol.value
  }),
})

const amount = defineModel('amount', { type: String })

const normalizedAmount = computed(() => {
  if (amount.value === undefined || asset.value === undefined) {
    return ''
  }
  return new Decimal(amount.value).dividedBy(10 ** asset.value.decimal).toFixed()
})

const updateAmount = (_amount: string) => {
  if (!asset.value) {
    return
  }
  if (_amount === '') {
    amount.value = undefined
    return
  }

  amount.value = new Decimal(_amount).times(10 ** asset.value.decimal).toFixed(0)

  emit('becameSource')
}

const amountTextSize = computed(() => {
  if (!amount.value) {
    return 'text-4xl'
  }

  if (normalizedAmount.value.length > 16) {
    return 'text-xs'
  }

  if (normalizedAmount.value.length > 12) {
    return 'text-lg'
  }

  if (normalizedAmount.value.length > 10) {
    return 'text-xl'
  }

  if (normalizedAmount.value.length > 8) {
    return 'text-2xl'
  }

  if (normalizedAmount.value.length > 6) {
    return 'text-3xl'
  }

  return 'text-4xl'
})

const balanceDisplay = computed(() => {
  if (balance.value) {
    return calcBalance(balance.value.confirmed.toNumber(), asset.value?.decimal || 0, asset.value?.symbol || '--')
  }
  return '--'
})

const fiatPrice = computed(() => {
  if (amount.value && exchangeRate.value) {
    const unit = new Decimal(amount.value).dividedBy(10 ** (asset.value?.decimal || 0))
    return unit.mul(new Decimal(exchangeRate.value?.price || 0))
  }
})

const hasEnough = computed(() => {
  if (!amount.value) {
    return true
  }

  if (props.side === 'receive') {
    return true
  }

  return new Decimal(amount.value).lte(balance.value?.total || 0)
})

const amountMoreThanThreshold = computed(() => {
  // only check when symbol is btc
  if (symbol.value !== 'BTC') {
    return true
  }

  if (!amount.value) {
    return true
  }

  return new Decimal(amount.value).gte(SWAP_THRESHOLD_AMOUNT)
})

watch(
  () => hasEnough.value,
  (hasEnough) => {
    if (hasEnough) {
      emit('hasEnough')
    } else {
      emit('notEnough')
    }
  }
)

watch(
  () => amountMoreThanThreshold.value,
  (moreThanThreshold) => {
    emit('lessThanThreshold', !moreThanThreshold)
  }
)

// watch for change of amount; emit event
watch(
  () => amount.value,
  (amount) => {
    if (amount) {
      emit('amountEntered')
    } else {
      emit('amountCleared')
    }
  }
)

const useTotalBalance = () => {
  if (balance.value?.total) {
    amount.value = balance.value?.total.toDP().toFixed()
    emit('becameSource')
  }
}

const clear = () => {
  amount.value = undefined
}
</script>

<template>
  <div class="rounded-2xl border border-gray-secondary px-4 py-5 bg-gray-secondary hover:border-gray-soft">
    <div class="text-black-primary">You {{ side }}</div>

    <div class="flex h-16 items-center justify-between space-x-2">
      <input
        min="0"
        :id="`${side}Amount`"
        :disabled="disabled || side === 'receive'"
        :class="[
          'quiet-input w-12 flex-1 bg-transparent p-0 leading-loose outline-none',
          amountTextSize,
          disabled || (side === 'receive' && 'cursor-not-allowed'),
          hasEnough
            ? calculating
              ? 'text-gray-primary'
              : 'text-black-primary/80 caret-runes'
            : calculating
              ? 'text-red-900/50 caret-red-900/50'
              : 'text-red-primary caret-red-500',
        ]"
        placeholder="0"
        type="number"
        :value="normalizedAmount"
        @input="(event: any) => updateAmount(event.target.value)"
      />

      <button v-if="side === 'pay' && amount && amount !== '0'" @click="clear">
        <EraserIcon class="size-4 text-zinc-300 hover:text-zinc-500" />
      </button>

      <Loader2Icon class="animate-spin text-zinc-400" v-if="calculating" />

      <div :class="['flex items-center gap-1 rounded-full bg-white p-1 px-2 text-xl shadow-sm']" v-else>
        <RunesTokenIcon :symbol="asset?.symbol" class="size-6 text-xs" v-if="coinCategory === CoinCategory.Runes" />
        <AssetLogo :logo="icon" :chain="asset?.chain" :symbol="asset?.symbol" class="size-6 text-xs" v-else />
        <div class="mr-1" :class="['text-sm font-medium']">
          {{ symbol }}
        </div>
      </div>
    </div>

    <div
      v-if="hasEnough && !calculating && !amountMoreThanThreshold"
      class="-mt-2 mb-2 flex items-center gap-2 text-sm text-red-primary"
    >
      <AlertCircleIcon class="size-4" />
      Amount should be at least {{ SWAP_THRESHOLD_AMOUNT / 1e8 }} BTC
    </div>

    <div class="flex items-center justify-between">
      <div class="text-sm text-zinc-400" v-if="fiatPrice">
        {{ '$' + fiatPrice.toFixed() }}
      </div>
      <div class="w-1" v-else></div>

      <button
        :disabled="disabled"
        @click="useTotalBalance"
        v-if="balance?.confirmed.toNumber()"
        :class="['text-xs text-zinc-400 hover:text-runes hover:underline', { 'cursor-not-allowed': disabled }]"
      >
        Balance: {{ balanceDisplay }}
      </button>

      <div class="text-xs text-zinc-400" v-else>Balance: {{ balanceDisplay }}</div>
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
