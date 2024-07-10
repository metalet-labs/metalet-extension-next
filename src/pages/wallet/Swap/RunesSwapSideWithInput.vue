<script setup lang="ts">
import { computed, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Decimal from 'decimal.js'
import { Loader2Icon, EraserIcon, AlertCircleIcon } from 'lucide-vue-next'

import { getRuneBalanceQuery } from '@/queries/runes/balance.query'
import { getExcludedBalanceQuery } from '@/queries/excluded-balance.query'
import { getBrcFiatRate, getFiatRate } from '@/queries/orders-api'

import { calcFiatPrice, unit, useBtcUnit } from '@/lib/helpers'
import { prettyBalance, prettyRuneDisplay, prettyRuneSymbol } from '@/lib/formatters'

import { SWAP_THRESHOLD_AMOUNT } from '@/data/constants'
import { type RuneToken } from '@/data/pinned-tokens'

const props = defineProps({
  side: {
    type: String,
    required: true,
    validator: (side: string) => ['pay', 'receive'].includes(side),
  },
  calculating: {
    type: Boolean,
    default: false,
  },
})
const symbol = defineModel('symbol', { required: true, type: String })
const rune = defineModel<RuneToken>('rune')
const isRune = computed(() => !!rune.value)
const useSymbol = computed(() => (isRune.value ? rune.value?.symbol || 'R' : symbol.value))

// amount
const amount = defineModel('amount', { type: String })
const normalizedAmount = computed(() => {
  if (!amount.value) {
    return ''
  }

  const dividedBy = symbol.value.toLowerCase() === 'btc' ? 1e8 : 10 ** (rune.value?.divisibility || 0)
  return new Decimal(amount.value).dividedBy(dividedBy).toDP().toFixed()
})
const updateAmount = (updatingAmount: number | string) => {
  if (typeof updatingAmount === 'string') {
    updatingAmount = Number(updatingAmount)
  }
  if (isNaN(updatingAmount)) {
    updatingAmount = 0
  }

  const times = symbol.value.toLowerCase() === 'btc' ? 1e8 : 10 ** (rune.value?.divisibility || 0)
  amount.value = new Decimal(updatingAmount).times(times).toFixed()

  // this side is now the source
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

const emit = defineEmits([
  'hasEnough',
  'notEnough',
  'moreThanThreshold',
  'lessThanThreshold',
  'amountEntered',
  'amountCleared',
  'update:symbol',
  'becameSource',
])

// fiat price
const { data: btcFiatRate } = useQuery({
  queryKey: ['fiatRate', { coin: 'btc' }],
  queryFn: getFiatRate,
})
const { data: brcFiatRates } = useQuery({
  queryKey: ['brcFiatRate'],
  queryFn: getBrcFiatRate,
  enabled: computed(() => false),
})

const fiatPrice = computed(() => {
  if (!amount.value) {
    return null
  }

  if (symbol.value === 'btc') {
    if (!btcFiatRate.value) {
      return null
    }

    return calcFiatPrice(amount.value, btcFiatRate.value)
  }

  if (!brcFiatRates.value) {
    return null
  }

  const rate = brcFiatRates.value[symbol.value.toLowerCase()]
  return calcFiatPrice(amount.value, rate)
})

// balance
const { data: btcBalance } = useQuery(
  getExcludedBalanceQuery(
    { address: connectionStore.getAddress },
    computed(() => !!connectionStore.connected)
  )
)
const { data: myRuneBalances } = useQuery(
  getRuneBalanceQuery(
    { address: computed(() => connectionStore.getAddress) },
    computed(() => connectionStore.connected)
  )
)

const balance = computed(() => {
  if (isRune.value) {
    // find symbol's balance
    const runeBalance = myRuneBalances.value?.find((runeBalance) => runeBalance.runeid === rune.value?.runeid)

    if (!runeBalance) {
      return 0
    }

    return Number(runeBalance.amount)
  }

  if (!btcBalance.value) {
    return 0
  }

  return btcBalance.value
})

const balanceDisplay = computed(() => {
  if (balance.value === 0) {
    return '0'
  }

  if (isRune.value) {
    return prettyRuneDisplay({
      amount: balance.value,
      divisibility: rune.value?.divisibility,
      symbol: rune.value?.symbol || 'R',
    })
  }

  return `${prettyBalance(balance.value, useBtcUnit.value)} ${unit.value}`
})

// use total balance
const useTotalBalance = () => {
  if (symbol.value !== 'btc') {
    // find symbol's balance
    const runeBalance = myRuneBalances.value?.find((rb) => rb.runeid.toLowerCase() === symbol.value.toLowerCase())

    if (!runeBalance) {
      amount.value = '0'
      return
    }

    amount.value = runeBalance.amount
    return
  }

  if (!btcBalance.value) {
    amount.value = '0'
    return
  }

  // TODO: Use 95% of balance temporarily
  amount.value = new Decimal(btcBalance.value).times(0.95).toFixed(0)

  // this side is now the source
  emit('becameSource')
}

const hasEnough = computed(() => {
  if (!amount.value) {
    return true
  }

  if (props.side === 'receive') {
    return true
  }

  return new Decimal(amount.value).lte(new Decimal(balance.value))
})

const amountMoreThanThreshold = computed(() => {
  // only check when symbol is btc
  if (symbol.value !== 'btc') {
    return true
  }

  if (!amount.value) {
    return true
  }

  return new Decimal(amount.value).gte(SWAP_THRESHOLD_AMOUNT)
})

// watch for change of hasEnough; emit event
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
    if (moreThanThreshold) {
      emit('moreThanThreshold')
    } else {
      emit('lessThanThreshold')
    }
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
</script>

<template>
  <div class="swap-sub-control-panel">
    <div class="text-zinc-400">You {{ side }}</div>

    <div class="flex h-16 items-center justify-between space-x-2">
      <input
        class="quiet-input w-12 flex-1 bg-transparent p-0 leading-loose"
        :id="`${side}Amount`"
        :class="[
          hasEnough
            ? calculating
              ? 'text-zinc-500'
              : 'text-zinc-100 caret-runes'
            : calculating
              ? 'text-red-900/50 caret-red-900/50'
              : 'text-red-500 caret-red-500',
          // if too long, make it smaller
          amountTextSize,
        ]"
        placeholder="0"
        type="number"
        :value="normalizedAmount"
        @input="(event: any) => updateAmount(event.target.value)"
      />

      <button v-if="side === 'pay' && amount" @click="updateAmount(0)">
        <EraserIcon class="size-4 text-zinc-500 hover:text-zinc-300" />
      </button>

      <Loader2Icon class="animate-spin text-zinc-400" v-if="calculating" />

      <div :class="['flex items-center gap-1 rounded-full bg-zinc-900 p-1 px-4 text-xl']">
        <RunesTokenIcon :symbol="useSymbol" class="size-6 rounded-full" v-if="isRune && useSymbol" />
        <TokenIcon :token="useSymbol" class="size-6 rounded-full" v-else-if="useSymbol" />
        <div class="mr-1" :class="[isRune && 'text-xs']">
          {{ prettyRuneSymbol(useSymbol) }}
        </div>
      </div>
    </div>

    <!-- warning -->
    <div
      class="-mt-2 mb-2 flex items-center gap-2 text-sm text-red-500"
      v-if="hasEnough && !calculating && !amountMoreThanThreshold"
    >
      <AlertCircleIcon class="size-4" />
      Amount should be at least {{ SWAP_THRESHOLD_AMOUNT / 1e8 }} BTC
    </div>

    <!-- data footer -->
    <div class="flex items-center justify-between">
      <!-- fiat price -->
      <div class="text-sm text-zinc-400" v-if="fiatPrice">
        {{ fiatPrice ? '$' + fiatPrice : '-' }}
      </div>
      <div class="w-1" v-else></div>

      <!-- balance -->
      <button
        class="text-xs text-zinc-400 hover:text-runes hover:underline"
        v-if="side === 'pay'"
        v-show="!!useSymbol"
        @click="useTotalBalance"
      >
        Balance: {{ balanceDisplay }}
      </button>

      <div class="text-xs text-zinc-400" v-else v-show="!!useSymbol">Balance: {{ balanceDisplay }}</div>
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
