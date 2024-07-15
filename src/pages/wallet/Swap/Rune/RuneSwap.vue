<script lang="ts" setup>
import Decimal from 'decimal.js'
import { sleep } from '@/lib/helpers'
import { ERRORS } from '@/data/errors'
import { BTCAsset } from '@/data/assets'
import { computed, ref, toRaw, watch } from 'vue'
import { useBalanceQuery } from '@/queries/balance'
import { Chain } from '@metalet/utxo-wallet-service'
import { useSwapPool } from '@/hooks/swap/useSwapPool'
import { CoinCategory } from '@/queries/exchange-rates'
import { ArrowDownIcon, ArrowUpDownIcon } from 'lucide-vue-next'
import RunesSwapSideWithInput from './RunesSwapSideWithInput.vue'
import RunesSwapFrictionStats from './RunesSwapFrictionStats.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import RunesSwapPriceDisclosure from './RunesSwapPriceDisclosure.vue'
import { useRuneDetailQuery, SwapType, previewSwap } from '@/queries/runes'

const flippedControl = ref(false)
const calculatingPay = ref(false)
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const symbol = ref(BTCAsset.symbol)
const swapType = ref<SwapType>('1x')
const calculatingReceive = ref(false)
const ratio = ref<Decimal>(new Decimal(0))
const poolRatio = ref<Decimal>(new Decimal(0))
const serviceFee = ref<Decimal>(new Decimal(0))
const priceImpact = ref<Decimal>(new Decimal(0))
const flipped = computed(() => ['2x', 'x1'].includes(swapType.value))
const calculating = computed(() => calculatingPay.value || calculatingReceive.value)
const hasImpactWarning = computed(() => {
  // greater than 15%
  return priceImpact.value.gte(15)
})

const { getAddress } = useChainWalletsStore()
const { token1, token2: runeId } = useSwapPool()

const address = getAddress(Chain.BTC)

const conditions = ref<
  {
    condition: string
    message: string
    priority: number
    met: boolean
    handler?: Function
  }[]
>([
  {
    condition: 'not-select-token',
    message: 'Select a token',
    priority: 2,
    met: false,
  },
  {
    condition: 'insufficient-liquidity',
    message: 'Insufficient liquidity',
    priority: 3,
    met: true,
  },
  {
    condition: 'enter-amount',
    message: 'Enter an amount',
    priority: 4,
    met: false,
  },
  {
    condition: 'insufficient-balance',
    message: 'Insufficient balance',
    priority: 5,
    met: false,
  },
  {
    condition: 'more-than-threshold',
    message: 'Amount too small',
    priority: 6,
    met: false,
  },
  {
    condition: 'return-is-positive',
    message: 'Negative return',
    priority: 7,
    met: true,
  },
])

const flipAsset = async () => {
  flippedControl.value = !flippedControl.value

  await sleep(200)

  switch (swapType.value) {
    case '1x':
      swapType.value = '2x'
      break
    case '2x':
      swapType.value = '1x'
      break
    case 'x1':
      swapType.value = '1x'
      break
    case 'x2':
      swapType.value = '2x'
      break
  }

  token1Amount.value = undefined
  token2Amount.value = undefined
  // hasAmount.value = false
  // moreThanThreshold.value = true
}

const balanceEnabled = computed(() => {
  return !!address.value && !!symbol.value
})

const { data: balance } = useBalanceQuery(address, symbol, { enabled: balanceEnabled })

const btcAsset = computed(() => {
  if (balance.value) {
    return { ...BTCAsset, balance: toRaw(balance.value) }
  }
  return BTCAsset
})

const { data: runeAsset } = useRuneDetailQuery(address, runeId, {
  enabled: computed(() => !!address.value && !!runeId.value),
})

const sourceAmount = computed(() => {
  if (swapType.value.includes('1')) {
    return token1Amount.value
  } else {
    return token2Amount.value
  }
})

const returnIsPositive = ref(true)
watch(
  () => returnIsPositive.value,
  (returnIsPositive) => {
    if (returnIsPositive) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'return-is-positive') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'return-is-positive') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

watch(swapType, async (newSwapType) => {
  if (!sourceAmount.value) return

  // if is flipping to x1 or 2x, clear every amounts and return (since arbitrary brc as input is not supported)
  if (flipped.value) {
    token1Amount.value = undefined
    token2Amount.value = undefined
    return
  }

  // calculating
  if (newSwapType.indexOf('x') === 0) {
    calculatingPay.value = true
  } else {
    calculatingReceive.value = true
  }

  previewSwap({
    address: address.value,
    token1: token1.value.toLowerCase(),
    token2: runeId.value.toLowerCase(),
    swapType: newSwapType,
    sourceAmount: sourceAmount.value,
  })
    .then((preview) => {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-liquidity') {
          c.met = true
        }
        return c
      })

      ratio.value = new Decimal(preview.ratio)
      poolRatio.value = new Decimal(preview.poolRatio)
      priceImpact.value = new Decimal(preview.priceImpact)

      if (newSwapType.includes('1')) {
        token2Amount.value = preview.targetAmount
      } else {
        token1Amount.value = preview.targetAmount
      }
    })
    .catch((e) => {
      if (e.message === ERRORS.INSUFFICIENT_LIQUIDITY) {
        if (newSwapType.includes('1')) {
          token2Amount.value = undefined
        } else {
          token1Amount.value = undefined
        }

        conditions.value = conditions.value.map((c) => {
          if (c.condition === 'insufficient-liquidity') {
            c.met = false
          }
          return c
        })
      }
    })
    .finally(() => {
      calculatingPay.value = false
      calculatingReceive.value = false
    })
})

// watch for sourceAmount
watch([token1Amount, token2Amount], async ([newToken1Amount, newToken2Amount], [oldToken1Amount, oldToken2Amount]) => {
  const sourceChanging = swapType.value.includes('1')
    ? newToken1Amount !== oldToken1Amount
    : newToken2Amount !== oldToken2Amount
  if (!sourceChanging) return

  if (!sourceAmount.value) return

  if (Number(sourceAmount.value) === 0) {
    token1Amount.value = undefined
    token2Amount.value = undefined
    return
  }

  // calculating
  if (swapType.value.indexOf('x') === 0) {
    calculatingPay.value = true
  } else {
    calculatingReceive.value = true
  }

  previewSwap({
    address: address.value,
    token1: token1.value.toLowerCase(),
    token2: runeId.value.toLowerCase(),
    swapType: swapType.value,
    sourceAmount: sourceAmount.value,
  })
    .then((preview) => {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-liquidity') {
          c.met = true
        }
        return c
      })

      ratio.value = new Decimal(preview.ratio)
      poolRatio.value = new Decimal(preview.poolRatio)
      priceImpact.value = new Decimal(preview.priceImpact)
      serviceFee.value = new Decimal(preview.serviceFee)

      if (swapType.value.includes('1')) {
        token2Amount.value = preview.targetAmount
      } else {
        token1Amount.value = preview.targetAmount
      }
    })
    .catch((e) => {
      if (e.message === ERRORS.INSUFFICIENT_LIQUIDITY) {
        if (swapType.value.includes('1')) {
          token2Amount.value = undefined
        } else {
          token1Amount.value = undefined
        }

        conditions.value = conditions.value.map((c) => {
          if (c.condition === 'insufficient-liquidity') {
            c.met = false
          }
          return c
        })
      }
    })
    .finally(() => {
      calculatingPay.value = false
      calculatingReceive.value = false
    })
})
</script>

<template>
  <div class="flex flex-col items-center">
    <RunesSwapSideWithInput
      side="pay"
      class="w-full"
      :asset="btcAsset"
      v-if="btcAsset && !flipped"
      :calculating="calculatingPay"
      v-model:amount="token1Amount"
      @became-source="swapType = '1x'"
      :coinCategory="CoinCategory.Native"
    />
    <RunesSwapSideWithInput
      side="pay"
      class="w-full"
      :asset="runeAsset"
      :calculating="calculatingPay"
      v-model:amount="token2Amount"
      v-else-if="runeAsset && flipped"
      @became-source="swapType = '2x'"
      :coinCategory="CoinCategory.Rune"
    />

    <div class="relative z-30 my-0.5 flex h-0 justify-center">
      <div
        class="group absolute -translate-y-1/2 rounded-xl bg-gray-soft p-1 transition-all duration-500 hover:scale-110 lg:duration-150 text-gray-primary"
      >
        <ArrowDownIcon class="box-content inline h-4 w-4 rounded-lg bg-gray-soft p-2 group-hover:hidden" />

        <button
          class="box-content hidden rounded-lg bg-gray-soft p-2 shadow-sm shadow-runes/80 transition-all duration-500 group-hover:inline lg:duration-200"
          :class="{
            'rotate-180': flippedControl,
          }"
          @click="flipAsset"
        >
          <ArrowUpDownIcon class="h-4 w-4 text-runes" />
        </button>
      </div>
    </div>

    <RunesSwapSideWithInput
      side="receive"
      class="w-full"
      :asset="runeAsset"
      v-if="runeAsset && !flipped"
      v-model:amount="token2Amount"
      @became-source="swapType = 'x2'"
      :calculating="calculatingReceive"
      :coinCategory="CoinCategory.Rune"
    />

    <RunesSwapSideWithInput
      side="receive"
      class="w-full"
      :asset="btcAsset"
      v-if="btcAsset && flipped"
      v-model:amount="token1Amount"
      @became-source="swapType = 'x1'"
      :calculating="calculatingReceive"
      :coinCategory="CoinCategory.Native"
    />

    <RunesSwapPriceDisclosure
      class="w-full"
      :ratio="ratio"
      :rune="runeAsset"
      :pool-ratio="poolRatio"
      :token1-symbol="token1"
      :token2-symbol="runeId"
      :service-fee="serviceFee"
      :calculating="calculating"
      :price-impact="priceImpact"
      :has-impact-warning="hasImpactWarning"
      v-if="runeAsset && Number(sourceAmount)"
    />

    <RunesSwapFrictionStats
      class="w-full"
      :task-type="swapType"
      :service-fee="serviceFee"
      :token-1-amount="token1Amount"
      v-show="!!Number(sourceAmount)"
      @return-became-positive="returnIsPositive = true"
      @return-became-negative="returnIsPositive = false"
    />
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
