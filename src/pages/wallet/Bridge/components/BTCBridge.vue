<script lang="ts" setup>
import Decimal from 'decimal.js'
import { sleep } from '@/lib/helpers'
import { ERRORS } from '@/data/errors'
import { Asset, BTCAsset, MetaContractAsset } from '@/data/assets'
import RunesMainBtn from './RunesMainBtn.vue'
import { useMutation } from '@tanstack/vue-query'
import { computed, ref, toRaw, watch } from 'vue'
import { useBTCBalanceQuery } from '@/queries/balance'
import { CoinCategory } from '@/queries/exchange-rates'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import BridgeSideWithInput from './BridgeSideWithInput.vue'
import BridgeFrictionStats from './BridgeFrictionStats.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import BridgeSelectPairs from './BridgeSelectPairs.vue'
import BridgePriceDisclosure from './BridgePriceDisclosure.vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon, FileClockIcon } from 'lucide-vue-next'
import { SwapType } from '@/queries/runes'
import { useBridgeInfoQuery } from '@/queries/bridge'
import { useMetaContractAssetQuery } from '@/queries/metacontract'
import { calcMintBtcInfo, calcRedeemBtcInfo, mintBtc, redeemBtc } from '@/lib/bridge-utils'
import { calcBalance } from '@/lib/formatters'
import { assetReqReturnType } from '@/queries/types/bridge'
import { Protocol } from '@/lib/types/protocol'
import { useRouter } from 'vue-router'
import BridgeHistory from './BridgeHistory.vue'

const router = useRouter()
const flippedControl = ref(false)
const calculatingPay = ref(false)
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const symbol = ref(BTCAsset.symbol)
const currentRateFee = ref<number>()
const bridgeType = ref<SwapType>('1x')
const calculatingReceive = ref(false)
const serviceFee = ref<string>()
const networkFee = ref<string>()
const flipped = computed(() => ['2x', 'x1'].includes(bridgeType.value))
const calculating = computed(() => calculatingPay.value || calculatingReceive.value)

const { getAddress, currentBTCWallet, currentMVCWallet } = useChainWalletsStore()

const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)
const selectedPair = ref<assetReqReturnType>()
const genesis = computed(() => selectedPair.value?.targetTokenGenesis || '')
const codeHash = computed(() => selectedPair.value?.targetTokenCodeHash || '')

const { data: bridgePairInfo } = useBridgeInfoQuery()
const bridgePairs = computed(() => bridgePairInfo.value?.assetList.filter((item) => item.network === 'BTC'))

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

const { data: _metaContractAsset } = useMetaContractAssetQuery(mvcAddress, codeHash, genesis, {
  enabled: computed(() => !!mvcAddress.value && !!codeHash.value && !!genesis.value),
})

const metaContractAsset = computed(
  () =>
    _metaContractAsset.value ||
    ({
      symbol: selectedPair.value?.targetSymbol,
      tokenName: selectedPair.value?.targetName,
      isNative: false,
      chain: 'mvc',
      queryable: true,
      decimal: 0,
      balance: {
        confirmed: new Decimal(0),
        unconfirmed: new Decimal(0),
        total: new Decimal(0),
      },
      contract: CoinCategory.MetaContract,
      protocol: Protocol.MetaContract,
      codeHash: codeHash.value,
      genesis: genesis.value,
      sensibleId: '',
    } as MetaContractAsset)
)

const sourceAmount = computed(() => {
  if (bridgeType.value.includes('1')) {
    return token1Amount.value
  } else {
    return token2Amount.value
  }
})

const sourceSymbol = computed(() => {
  if (bridgeType.value.includes('1')) {
    return btcAsset.value.symbol
  } else {
    return metaContractAsset.value.symbol
  }
})

watch(sourceAmount, (sourceAmount) => {
  if (!sourceAmount) {
    token1Amount.value = undefined
    token2Amount.value = undefined
  }
})

const mint = async () => {
  try {
    if (
      sourceAmount.value &&
      selectedPair.value &&
      currentBTCWallet.value &&
      currentMVCWallet.value &&
      bridgePairInfo.value
    ) {
      if (bridgeType.value.includes('1')) {
        const { txId, recipient } = await mintBtc(
          new Decimal(sourceAmount.value).toNumber(),
          selectedPair.value.originTokenId,
          currentBTCWallet.value.getScriptType(),
          currentBTCWallet.value,
          currentMVCWallet.value,
          bridgePairInfo.value.feeBtc
        )
        router.replace({
          name: 'SendSuccess',
          params: {
            txId,
            chain: btcAsset.value.chain,
            symbol: btcAsset.value.symbol,
            amount: new Decimal(sourceAmount.value).div(10 ** btcAsset.value.decimal).toFixed(),
            address: recipient,
            coinCategory: CoinCategory.Native,
          },
        })
      } else {
        const { txId, recipient } = await redeemBtc(
          new Decimal(sourceAmount.value).toNumber(),
          selectedPair.value,
          currentBTCWallet.value.getScriptType(),
          currentBTCWallet.value,
          currentMVCWallet.value
        )
        router.replace({
          name: 'SendSuccess',
          params: {
            txId,
            chain: metaContractAsset.value.chain,
            symbol: metaContractAsset.value.symbol,
            amount: new Decimal(sourceAmount.value).div(10 ** metaContractAsset.value.decimal).toFixed(),
            address: recipient,
            coinCategory: CoinCategory.MetaContract,
          },
        })
      }
    }
  } catch (err) {
    console.log(err)
  }
}

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

  switch (bridgeType.value) {
    case '1x':
      bridgeType.value = '2x'
      break
    case '2x':
      bridgeType.value = '1x'
      break
    case 'x1':
      bridgeType.value = '1x'
      break
    case 'x2':
      bridgeType.value = '2x'
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
        calculatingReceive.value = true
        if (bridgeType.value.includes('1')) {
          const info = calcMintBtcInfo(Number(sourceAmount.value), bridgePairInfo.value!)
          serviceFee.value = info.bridgeFee.toString()
          networkFee.value = info.minerFee.toString()
          token2Amount.value = new Decimal(10).pow(metaContractAsset.value!.decimal).mul(info.receiveAmount).toFixed()
        } else {
          const info = calcRedeemBtcInfo(Number(sourceAmount.value), bridgePairInfo.value!)
          serviceFee.value = info.bridgeFee.toString()
          networkFee.value = info.minerFee.toString()
          token1Amount.value = new Decimal(10).pow(btcAsset.value!.decimal).mul(info.receiveAmount).toFixed()
        }
        calculatingReceive.value = false
      } catch (error) {
        if (bridgeType.value.includes('1')) {
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
    <div class="flex flex-row-reverse w-full items-center justify-between h-8">
      <BridgeHistory protocolType="btc" :bridgeType="bridgeType === '1x' ? 'mint' : 'redeem'" />
      <BridgeSelectPairs :bridgePairs="bridgePairs" v-model:selectedPair="selectedPair" />
    </div>
    <div class="w-full">
      <BridgeSideWithInput
        side="pay"
        v-if="!flipped"
        :asset="btcAsset"
        :calculating="calculatingPay"
        v-model:amount="token1Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
        @became-source="bridgeType = '1x'"
        @amount-entered="hasAmount = true"
        @amount-cleared="hasAmount = false"
        :coinCategory="CoinCategory.Native"
        :limit-maximum="bridgePairInfo?.amountLimitMaximum"
        :limit-minimum="bridgePairInfo?.amountLimitMinimum"
      />
      <BridgeSideWithInput
        side="pay"
        v-else-if="flipped"
        :asset="metaContractAsset"
        :calculating="calculatingPay"
        v-model:amount="token2Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
        @became-source="bridgeType = '2x'"
        :coinCategory="CoinCategory.MetaContract"
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

      <!-- FIXME: wbtc logo do not load -->
      <BridgeSideWithInput
        side="receive"
        v-if="!flipped"
        :asset="metaContractAsset"
        v-model:amount="token2Amount"
        @became-source="bridgeType = 'x2'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.MetaContract"
      />

      <BridgeSideWithInput
        side="receive"
        v-if="flipped"
        :asset="btcAsset"
        v-model:amount="token1Amount"
        @became-source="bridgeType = 'x1'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.Native"
        @more-than-threshold="moreThanThreshold = true"
        @less-than-threshold="moreThanThreshold = false"
      />

      <BridgePriceDisclosure
        :service-fee="serviceFee"
        :network-fee="networkFee"
        :symbol="btcAsset.symbol"
        :calculating="calculating"
        :decimal="btcAsset.decimal"
        :token1-symbol="btcAsset.symbol"
        :token2-symbol="metaContractAsset.symbol"
        v-if="Number(sourceAmount)"
      />

      <!-- FIXME: asset decimal not allow more than 8 -->
      <BridgeFrictionStats
        @fee-rate-onchange="(_currentRateFee) => (currentRateFee = _currentRateFee)"
        :limit-minimum="calcBalance(Number(bridgePairInfo?.amountLimitMinimum), btcAsset.decimal, sourceSymbol)"
        :limit-maximum="calcBalance(Number(bridgePairInfo?.amountLimitMaximum), btcAsset.decimal, sourceSymbol)"
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
    <RunesMainBtn v-else @click="mint">Bridge</RunesMainBtn>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
