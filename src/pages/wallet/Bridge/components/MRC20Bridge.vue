<script lang="ts" setup>
import Decimal from 'decimal.js'
import { sleep } from '@/lib/helpers'
import { ERRORS } from '@/data/errors'
import { Asset, BTCAsset } from '@/data/assets'
import RunesMainBtn from './RunesMainBtn.vue'
import { useMutation } from '@tanstack/vue-query'
import { computed, ref, toRaw, watch } from 'vue'
import { useBTCBalanceQuery } from '@/queries/balance'
import { CoinCategory } from '@/queries/exchange-rates'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import RunesSwapSideWithInput from './RunesSwapSideWithInput.vue'
import RunesSwapFrictionStats from './RunesSwapFrictionStats.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import BridgeSelectPairs from '../components/BridgeSelectPairs.vue'
import RunesSwapPriceDisclosure from './RunesSwapPriceDisclosure.vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon, FileClockIcon } from 'lucide-vue-next'
import { SwapType } from '@/queries/runes'
import { useBridgeInfoQuery } from '@/queries/bridge'
import { useMetaContractAssetQuery } from '@/queries/metacontract'
import { calcMintBtcInfo, calcRedeemBtcInfo } from '@/lib/bridge-utils'
import { calcBalance } from '@/lib/formatters'

const flippedControl = ref(false)
const calculatingPay = ref(false)
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const symbol = ref(BTCAsset.symbol)
const currentRateFee = ref<number>()
const swapType = ref<SwapType>('1x')
const calculatingReceive = ref(false)
const serviceFee = ref<string>()
const networkFee = ref<string>()
const priceImpact = ref<Decimal>(new Decimal(0))
const flipped = computed(() => ['2x', 'x1'].includes(swapType.value))
const calculating = computed(() => calculatingPay.value || calculatingReceive.value)
const hasImpactWarning = computed(() => {
  // greater than 15%
  return priceImpact.value.gte(15)
})

const { getAddress } = useChainWalletsStore()

const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)
const codeHash = ref()
const genesis = ref()

const { data: bridgePairInfo } = useBridgeInfoQuery(ref(CoinCategory.Native))

const { data: balance } = useBTCBalanceQuery(btcAddress, {
  enabled: computed(() => {
    return !!btcAddress.value && !!symbol.value
  }),
})

const btcAsset = computed(() => {
  if (balance.value) {
    return { ...BTCAsset, balance: toRaw(balance.value) }
  }
  return BTCAsset
})

const { data: metaContractAsset } = useMetaContractAssetQuery(mvcAddress, codeHash, genesis, {
  enabled: computed(() => !!mvcAddress.value && !!codeHash.value && !!genesis.value),
})

const sourceAmount = computed(() => {
  if (swapType.value.includes('1')) {
    return token1Amount.value
  } else {
    return token2Amount.value
  }
})

watch(sourceAmount, (sourceAmount) => {
  if (!sourceAmount) {
    token1Amount.value = undefined
    token2Amount.value = undefined
  }
})

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

  hasAmount.value = false
  moreThanThreshold.value = true
  token1Amount.value = undefined
  token2Amount.value = undefined
}

watch(
  () => sourceAmount.value,
  () => {
    if (sourceAmount.value) {
      try {
        if (swapType.value.includes('1')) {
          const info = calcMintBtcInfo(Number(sourceAmount.value), bridgePairInfo.value!)
          serviceFee.value = new Decimal(info.bridgeFee).toFixed(8) + ' BTC'
          networkFee.value = new Decimal(info.minerFee).toFixed(8) + ' BTC'
          token2Amount.value = new Decimal(10).pow(metaContractAsset.value!.decimal).mul(info.receiveAmount).toFixed()
        } else {
          const info = calcRedeemBtcInfo(Number(sourceAmount.value), bridgePairInfo.value!)
          serviceFee.value = new Decimal(info.bridgeFee).toFixed(8) + ' BTC'
          networkFee.value = new Decimal(info.minerFee).toFixed(8) + ' BTC'
          token1Amount.value = new Decimal(10).pow(btcAsset.value!.decimal).mul(info.receiveAmount).toFixed()
        }
      } catch (error) {
        if (swapType.value.includes('1')) {
          token2Amount.value = undefined
        } else {
          token1Amount.value = undefined
        }
      }
    }
  }
)

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
</script>

<template>
  <div class="flex flex-col items-center gap-y-4">
    <div class="flex w-full items-center justify-between">
      <BridgeSelectPairs
        v-model:codeHash="codeHash"
        v-model:genesis="genesis"
        :bridgePairs="bridgePairInfo?.assetList"
      />
      <FileClockIcon class="text-gray-primary cursor-pointer" />
    </div>
    <div class="w-full">
      <RunesSwapSideWithInput
        side="pay"
        v-if="!flipped"
        :asset="btcAsset"
        :calculating="calculatingPay"
        v-model:amount="token1Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
        @became-source="swapType = '1x'"
        @amount-entered="hasAmount = true"
        @amount-cleared="hasAmount = false"
        :coinCategory="CoinCategory.Native"
        :limit-maximum="bridgePairInfo?.amountLimitMaximum"
        :limit-minimum="bridgePairInfo?.amountLimitMinimum"
      />
      <RunesSwapSideWithInput
        side="pay"
        v-else-if="flipped"
        :asset="metaContractAsset"
        :calculating="calculatingPay"
        v-model:amount="token2Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
        @became-source="swapType = '2x'"
        :coinCategory="CoinCategory.Rune"
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
            <ArrowUpDownIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <RunesSwapSideWithInput
        side="receive"
        v-if="!flipped"
        :asset="metaContractAsset"
        v-model:amount="token2Amount"
        @became-source="swapType = 'x2'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.MetaContract"
      />

      <RunesSwapSideWithInput
        side="receive"
        v-if="flipped"
        :asset="btcAsset"
        v-model:amount="token1Amount"
        @became-source="swapType = 'x1'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.Native"
        @more-than-threshold="moreThanThreshold = true"
        @less-than-threshold="moreThanThreshold = false"
      />

      <RunesSwapPriceDisclosure
        :service-fee="serviceFee"
        :network-fee="networkFee"
        :calculating="calculating"
        :token1-symbol="btcAsset.symbol"
        :token2-symbol="metaContractAsset.symbol"
        v-if="metaContractAsset && Number(sourceAmount)"
      />

      <RunesSwapFrictionStats
        :task-type="swapType"
        :service-fee="serviceFee"
        :token-1-amount="token1Amount"
        @return-became-positive="returnIsPositive = true"
        @return-became-negative="returnIsPositive = false"
        @fee-rate-onchange="(_currentRateFee) => (currentRateFee = _currentRateFee)"
        :limit-minimum="calcBalance(Number(bridgePairInfo?.amountLimitMinimum), btcAsset.decimal, 'BTC')"
        :limit-maximum="calcBalance(Number(bridgePairInfo?.amountLimitMaximum), btcAsset.decimal, 'BTC')"
      />
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
    <RunesMainBtn v-else @click="" :dangerous="hasImpactWarning">
      {{ hasImpactWarning ? 'Bridge Anyway' : 'Bridge' }}
    </RunesMainBtn>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
