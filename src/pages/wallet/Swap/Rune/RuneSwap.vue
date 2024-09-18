<script lang="ts" setup>
import Decimal from 'decimal.js'
import { sleep } from '@/lib/helpers'
import { ERRORS } from '@/data/errors'
import { BTCAsset } from '@/data/assets'
import { toast } from '@/components/ui/toast'
import RunesMainBtn from './RunesMainBtn.vue'
import { useMutation } from '@tanstack/vue-query'
import { computed, ref, toRaw, watch } from 'vue'
import { useBalanceQuery } from '@/queries/balance'
import { getRuneUtxos, UTXO } from '@/queries/utxos'
import { useSwapPool } from '@/hooks/swap/useSwapPool'
import { CoinCategory } from '@/queries/exchange-rates'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import RunesSwapSideWithInput from './RunesSwapSideWithInput.vue'
import RunesSwapFrictionStats from './RunesSwapFrictionStats.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import RunesSwapPriceDisclosure from './RunesSwapPriceDisclosure.vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import {
  useRuneDetailQuery,
  SwapType,
  previewSwap,
  build1xSwap,
  buildX2Swap,
  build2xSwap,
  buildX1Swap,
} from '@/queries/runes'
import RunesModalTokenSelect from './RunesModalTokenSelect.vue'
import EmptyPoolMessage from './EmptyPoolMessage.vue'
import { usePoolStatusQuery } from '@/queries/runes/pool-status.query'
import BridgeHistory from '../../Bridge/components/BridgeHistory.vue'

const flippedControl = ref(false)
const calculatingPay = ref(false)
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const symbol = ref(BTCAsset.symbol)
const currentRateFee = ref<number>()
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

const buildSwapFn = computed(() => {
  switch (swapType.value) {
    case '1x':
      return build1xSwap
    case '2x':
      return build2xSwap
    case 'x2':
      return buildX2Swap
    case 'x1':
      return buildX1Swap
  }
})

const { mutate: mutateBuildSwap } = useMutation({
  mutationFn: buildSwapFn,
})

const { getAddress, currentBTCWallet } = useChainWalletsStore()

const address = getAddress(Chain.BTC)

const { token1, token2: runeId } = useSwapPool()

const { data: poolStatus } = usePoolStatusQuery(
  token1,
  runeId,
  address,
  computed(() => !!address.value && !!token1.value && !!runeId.value)
)

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

const hasUnmet = computed(() => {
  return conditions.value.some((c) => !c.met)
})

const unmet = computed(() => {
  // use highest priority unmet condition
  if (!hasUnmet.value) {
    return
  }

  const unmets = conditions.value.filter((c) => !c.met)

  return unmets.reduce((prev, curr) => {
    return prev.priority < curr.priority ? prev : curr
  }, unmets[0])
})

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
  hasAmount.value = false
  moreThanThreshold.value = true
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

const hasAmount = ref(false)
watch(
  () => hasAmount.value,
  (hasAmount) => {
    if (hasAmount) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'enter-amount') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'enter-amount') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

const hasEnough = ref(true)
watch(
  () => hasEnough.value,
  (hasEnough) => {
    if (hasEnough) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-balance') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'insufficient-balance') {
          c.met = false
        }
        return c
      })
    }
  },
  { immediate: true }
)

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

const moreThanThreshold = ref(true)
watch(
  () => moreThanThreshold.value,
  (moreThanThreshold) => {
    if (moreThanThreshold) {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'more-than-threshold') {
          c.met = true
        }
        return c
      })
    } else {
      conditions.value = conditions.value.map((c) => {
        if (c.condition === 'more-than-threshold') {
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

  // if (!sourceAmount.value) return

  if (!sourceAmount.value) {
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

async function doSwap() {
  if (!hasEnough.value) return
  if (!hasAmount.value) return
  if (!sourceAmount.value) return
  if (unmet.value) {
    if (unmet.value.handler) {
      unmet.value.handler()
    }
    return
  }

  const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH
  let runeUtxos = [] as UTXO[]

  if (swapType.value.includes('2')) {
    runeUtxos = await getRuneUtxos(address.value, runeId.value, needRawTx)
    if (runeUtxos.length === 0) {
      toast({ toastType: 'warning', title: ERRORS.NO_RUNES })
      return
    }
  }

  if (!currentRateFee.value) {
    toast({ toastType: 'warning', title: ERRORS.HAVE_NOT_CHOOSE_GAS_RATE })
    return
  }

  // go for it!
  const data = mutateBuildSwap({
    runeUtxos,
    address: address.value,
    feeRate: currentRateFee.value,
    sourceAmount: sourceAmount.value,
    token1: token1.value.toLowerCase(),
    token2: runeId.value.toLowerCase(),
    pubkey: currentBTCWallet.value!.getPublicKey().toString('hex'),
  })
  console.log('data', data)
}

// const afterBuildSwap = async ({
//   rawPsbt,
//   buildId,
//   type,
//   feeRate,
// }: {
//   rawPsbt: string
//   buildId: string
//   type: SwapType
//   feeRate: number
// }) => {
//   const btcjs = btcjsStore.get!
//   switch (type) {
//     case '1x':
//       // continue building and add change to the psbt
//       const psbt1x = btcjs.Psbt.fromHex(rawPsbt, {
//         network: networkStore.typedNetwork,
//       })
//       const { psbt: psbt1xFinished } = await exclusiveChange({
//         psbt: psbt1x,
//         maxUtxosCount: USE_UTXO_COUNT_LIMIT,
//         sighashType: SIGHASH_ALL,
//         feeb: feeRate,
//       })
//       if (!psbt1xFinished) throw new Error('Failed to add change')

//       const signed1x = await connectionStore.adapter.signPsbt(
//         psbt1xFinished.toHex(),
//         {
//           autoFinalized: false,
//         },
//       )
//       if (!signed1x) return
//       if (!sourceAmount.value) return

//       mutatePostSwap({
//         rawPsbt: signed1x,
//         buildId,
//       })
//       break

//     case 'x2':
//       // continue building and add change to the psbt
//       const psbtX2 = btcjs.Psbt.fromHex(rawPsbt, {
//         network: networkStore.typedNetwork,
//       })
//       const { psbt: psbtX2Finished } = await exclusiveChange({
//         psbt: psbtX2,
//         maxUtxosCount: USE_UTXO_COUNT_LIMIT,
//         sighashType: SIGHASH_ALL,
//         feeb: feeRate,
//       })
//       if (!psbtX2Finished) throw new Error('Failed to add change')

//       const signedX2 = await connectionStore.adapter.signPsbt(
//         psbtX2Finished.toHex(),
//         {
//           autoFinalized: false,
//         },
//       )
//       if (!signedX2) return
//       if (!sourceAmount.value) return

//       mutatePostSwap({
//         rawPsbt: signedX2,
//         buildId,
//       })
//       break

//     case '2x': {
//       const token2Count = token2RuneUtxos.value?.length || 0
//       const address = connectionStore.getAddress
//       const toSignInputs = []
//       for (let i = 0; i < token2Count; i++) {
//         toSignInputs.push({
//           index: i,
//           sighashTypes: [SIGHASH_ALL_ANYONECANPAY],
//           address,
//         })
//       }
//       let options: any = {
//         autoFinalized: false,
//       }
//       const isOkWallet = connectionStore.last.wallet === 'okx'
//       if (isOkWallet) {
//         options['toSignInputs'] = toSignInputs
//       }
//       const signed2x = await connectionStore.adapter.signPsbt(rawPsbt, options)
//       if (!signed2x) return
//       if (!sourceAmount.value) return

//       mutatePostSwap({
//         rawPsbt: signed2x,
//         buildId,
//       })
//       break
//     }

//     case 'x1': {
//       const token2Count = token2RuneUtxos.value?.length || 0
//       const address = connectionStore.getAddress
//       const toSignInputs = []
//       for (let i = 0; i < token2Count; i++) {
//         toSignInputs.push({
//           index: i,
//           sighashTypes: [SIGHASH_ALL_ANYONECANPAY],
//           address,
//         })
//       }
//       let options: any = {
//         autoFinalized: false,
//       }
//       const isOkWallet = connectionStore.last.wallet === 'okx'
//       if (isOkWallet) {
//         options['toSignInputs'] = toSignInputs
//       }
//       const signedX1 = await connectionStore.adapter.signPsbt(rawPsbt, options)
//       if (!signedX1) return
//       if (!sourceAmount.value) return

//       mutatePostSwap({
//         rawPsbt: signedX1,
//         buildId,
//       })
//       break
//     }
//   }
// }
</script>

<template>
  <div class="flex flex-col items-center gap-y-4">
    <div class="flex flex-row-reverse w-full items-center justify-between h-8">
      <BridgeHistory protocolType="btc" :bridgeType="swapType === '1x' ? 'mint' : 'redeem'" />
      <RunesModalTokenSelect :btcAsset="btcAsset" />
    </div>
    <div class="w-full">
      <RunesSwapSideWithInput
        side="pay"
        :asset="btcAsset"
        v-if="btcAsset && !flipped"
        :calculating="calculatingPay"
        v-model:amount="token1Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
        @became-source="swapType = '1x'"
        @amount-entered="hasAmount = true"
        @amount-cleared="hasAmount = false"
        :coinCategory="CoinCategory.Native"
        @more-than-threshold="moreThanThreshold = true"
        @less-than-threshold="moreThanThreshold = false"
      />
      <RunesSwapSideWithInput
        side="pay"
        :asset="runeAsset"
        :calculating="calculatingPay"
        v-model:amount="token2Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
        v-else-if="runeAsset && flipped"
        @became-source="swapType = '2x'"
        :coinCategory="CoinCategory.Runes"
        @amount-entered="hasAmount = true"
        @amount-cleared="hasAmount = false"
      />

      <div class="relative z-30 my-0.5 flex h-0 justify-center">
        <div
          class="group absolute -translate-y-1/2 rounded-xl bg-white p-1 transition-all duration-500 hover:scale-110 lg:duration-150 text-gray-line"
        >
          <ArrowDownIcon class="box-content inline h-4 w-4 rounded-lg bg-gray-soft p-2 group-hover:hidden" />

          <button
            @click="flipAsset"
            :class="[
              'box-content hidden rounded-lg bg-gray-secondary p-2 shadow-sm shadow-runes/80 transition-all duration-500 group-hover:inline lg:duration-200',
              { 'rotate-180': flippedControl },
            ]"
          >
            <ArrowUpDownIcon class="h-4 w-4 text-runes" />
          </button>
        </div>
      </div>

      <RunesSwapSideWithInput
        side="receive"
        :asset="runeAsset"
        v-if="runeAsset && !flipped"
        v-model:amount="token2Amount"
        @became-source="swapType = 'x2'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.Runes"
      />

      <RunesSwapSideWithInput
        side="receive"
        :asset="btcAsset"
        v-if="btcAsset && flipped"
        v-model:amount="token1Amount"
        @became-source="swapType = 'x1'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.Native"
        @more-than-threshold="moreThanThreshold = true"
        @less-than-threshold="moreThanThreshold = false"
      />

      <RunesSwapPriceDisclosure
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
        :task-type="swapType"
        :service-fee="serviceFee"
        :token-1-amount="token1Amount"
        v-show="!!Number(sourceAmount)"
        @fee-rate-onchange="(_currentRateFee) => (currentRateFee = _currentRateFee)"
        @return-became-positive="returnIsPositive = true"
        @return-became-negative="returnIsPositive = false"
      />

      <!-- <EmptyPoolMessage :isEmpty="isEmpty" /> -->
    </div>

    <RunesMainBtn class="disabled" v-if="calculating" :disabled="true">
      <Loader2Icon class="mx-auto animate-spin text-zinc-400" />
    </RunesMainBtn>

    <RunesMainBtn
      v-else-if="unmet"
      :disabled="!unmet.handler"
      :class="[!unmet?.handler && 'disabled']"
      @click="!!unmet?.handler && unmet?.handler()"
    >
      {{ unmet.message || '' }}
    </RunesMainBtn>

    <!-- confirm button -->
    <RunesMainBtn v-else @click="doSwap" :dangerous="hasImpactWarning">
      {{ hasImpactWarning ? 'Swap Anyway' : 'Swap' }}
    </RunesMainBtn>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
