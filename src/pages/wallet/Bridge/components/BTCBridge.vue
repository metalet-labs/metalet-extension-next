<script lang="ts" setup>
import Decimal from 'decimal.js'
import { useRouter } from 'vue-router'
import { SwapType } from '@/queries/runes'
import { toast } from '@/components/ui/toast'
import RunesMainBtn from './RunesMainBtn.vue'
import { calcBalance } from '@/lib/formatters'
import { Protocol } from '@/lib/types/protocol'
import BridgeHistory from './BridgeHistory.vue'
import { useMutation } from '@tanstack/vue-query'
import { useBridgeInfoQuery } from '@/queries/bridge'
import { useBTCBalanceQuery } from '@/queries/balance'
import { CoinCategory } from '@/queries/exchange-rates'
import BridgeSelectPairs from './BridgeSelectPairs.vue'
import { assetReqReturnType } from '@/queries/types/bridge'
import BridgeFrictionStats from './BridgeFrictionStats.vue'
import BridgeSideWithInput from './BridgeSideWithInput.vue'
import { BTCAsset, MetaContractAsset } from '@/data/assets'
import { computed, ref, toRaw, watch, watchEffect } from 'vue'
import BridgePriceDisclosure from './BridgePriceDisclosure.vue'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useMetaContractAssetQuery } from '@/queries/metacontract'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import { calcMintBtcInfo, calcRedeemBtcInfo, mintBtc, redeemBtc } from '@/lib/bridge-utils'
import { useBTCUtxosQuery, useMVCUtxosQuery } from '@/queries/utxos'
import GoToMerge from '@/components/GoToMerge.vue'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'

const open = ref(false)
const router = useRouter()
const loading = ref(false)
const hasAmount = ref(false)
const hasEnough = ref(false)
const mergeUtxos = ref(false)
const serviceFee = ref<string>()
const networkFee = ref<string>()
const flippedControl = ref(false)
const calculatingPay = ref(false)
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const moreThanThreshold = ref(false)
const lessThanThreshold = ref(false)
const currentRateFee = ref<number>()
const calculatingReceive = ref(false)
const bridgeType = ref<SwapType>('1x')
const flipped = computed(() => ['2x', 'x1'].includes(bridgeType.value))
const calculating = computed(() => calculatingPay.value || calculatingReceive.value)

const { getAddress, currentBTCWallet, currentMVCWallet } = useChainWalletsStore()

const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)
const selectedPair = ref<assetReqReturnType>()
const genesis = computed(() => selectedPair.value?.targetTokenGenesis || '')
const codeHash = computed(() => selectedPair.value?.targetTokenCodeHash || '')

const { data: btcUtxos } = useBTCUtxosQuery(btcAddress, {
  useUnconfirmed: false,
  enabled: computed(() => !!btcAddress.value),
  needRawTx: currentBTCWallet.value?.getScriptType() === ScriptType.P2PKH,
})

const { data: mvcUtxos } = useMVCUtxosQuery(mvcAddress, {
  enabled: computed(() => !!btcAddress.value),
})

const { data: bridgePairInfo } = useBridgeInfoQuery()
const bridgePairs = computed(() => bridgePairInfo.value?.assetList.filter((item) => item.network === 'BTC'))

const { data: balance } = useBTCBalanceQuery(btcAddress, {
  useUnconfirmed: false,
  enabled: computed(() => !!btcAddress.value),
  needRawTx: currentBTCWallet.value?.getScriptType() === ScriptType.P2PKH,
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
  return bridgeType.value.includes('1') ? token1Amount.value : token2Amount.value
})

const sourceSymbol = computed(() => {
  return bridgeType.value.includes('1') ? btcAsset.value.symbol : metaContractAsset.value.symbol
})

const bridge = async () => {
  loading.value = true
  try {
    if (
      sourceAmount.value &&
      selectedPair.value &&
      currentBTCWallet.value &&
      currentMVCWallet.value &&
      bridgePairInfo.value
    ) {
      const { txId, recipient } = bridgeType.value.includes('1')
        ? await mintBtc(
            new Decimal(sourceAmount.value).toNumber(),
            selectedPair.value.originTokenId,
            currentBTCWallet.value.getScriptType(),
            currentBTCWallet.value,
            currentMVCWallet.value,
            bridgePairInfo.value.feeBtc
          )
        : await redeemBtc(
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
          chain: bridgeType.value.includes('1') ? btcAsset.value.chain : metaContractAsset.value.chain,
          symbol: bridgeType.value.includes('1') ? btcAsset.value.symbol : metaContractAsset.value.symbol,
          amount: new Decimal(sourceAmount.value)
            .div(10 ** (bridgeType.value.includes('1') ? btcAsset.value.decimal : metaContractAsset.value.decimal))
            .toFixed(),
          address: recipient,
          coinCategory: bridgeType.value.includes('1') ? CoinCategory.Native : CoinCategory.MetaContract,
        },
      })
    }
  } catch (err: any) {
    toast({ toastType: 'fail', title: err?.message || err })
  } finally {
    loading.value = false
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
    condition: 'enter-amount',
    message: 'Enter an amount',
    priority: 1,
    met: false,
  },
  {
    condition: 'insufficient-balance',
    message: 'Insufficient balance',
    priority: 2,
    met: false,
  },
  {
    condition: 'merge-utxo',
    message: 'Please merge your utxos',
    priority: 3,
    met: false,
  },
  {
    condition: 'less-than-threshold',
    message: 'Amount too small',
    priority: 4,
    met: false,
  },
  {
    condition: 'more-than-threshold',
    message: 'Amount too large',
    priority: 5,
    met: false,
  },
])

const hasUnmet = computed(() => conditions.value.some((c) => !c.met))
const unmet = computed(() => conditions.value.filter((c) => c.met).sort((a, b) => a.priority - b.priority)[0])

const flipAsset = async () => {
  flippedControl.value = !flippedControl.value

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
    default:
      bridgeType.value = '1x'
      break
  }

  hasAmount.value = false
  token1Amount.value = undefined
  token2Amount.value = undefined
  lessThanThreshold.value = false
  moreThanThreshold.value = false
}

watchEffect(() => {
  if (!sourceAmount.value) {
    token1Amount.value = undefined
    token2Amount.value = undefined
  } else {
    calculatingReceive.value = true
    try {
      const info = bridgeType.value.includes('1')
        ? calcMintBtcInfo(Number(sourceAmount.value), bridgePairInfo.value!)
        : calcRedeemBtcInfo(Number(sourceAmount.value), bridgePairInfo.value!)

      serviceFee.value = info.bridgeFee.toString()
      networkFee.value = info.minerFee.toString()
      if (bridgeType.value.includes('1')) {
        token2Amount.value = new Decimal(10).pow(metaContractAsset.value.decimal).mul(info.receiveAmount).toFixed()
      } else {
        token1Amount.value = new Decimal(10).pow(btcAsset.value.decimal).mul(info.receiveAmount).toFixed()
      }
    } catch {
      if (bridgeType.value.includes('1')) {
        token2Amount.value = undefined
      } else {
        token1Amount.value = undefined
      }
    } finally {
      calculatingReceive.value = false
    }
  }
})

watchEffect(() => {
  conditions.value.forEach((c) => {
    if (c.condition === 'enter-amount') {
      c.met = !sourceAmount.value
    }
    if (c.condition === 'insufficient-balance') {
      c.met = !hasEnough.value
    }
    if (c.condition === 'merge-utxo') {
      c.met = bridgeType.value === '1x' ? (btcUtxos.value?.length || 0) >= 50 : (mvcUtxos.value?.length || 0) >= 5
    }
    if (c.condition === 'less-than-threshold') {
      c.met = lessThanThreshold.value
    }
    if (c.condition === 'more-than-threshold') {
      c.met = moreThanThreshold.value
    }
  })
})
</script>

<template>
  <div class="flex flex-col items-center gap-y-4">
    <div class="flex flex-row-reverse w-full items-center justify-between h-8">
      <BridgeHistory protocolType="btc" :bridgeType="bridgeType === '1x' ? 'mint' : 'redeem'" />
      <BridgeSelectPairs :bridgePairs="bridgePairs" v-model:selectedPair="selectedPair" />
    </div>
    <div class="w-full">
      <GoToMerge v-model:open="open" />
      <BridgeSideWithInput
        side="pay"
        v-if="!flipped"
        :asset="btcAsset"
        :calculating="calculatingPay"
        v-model:amount="token1Amount"
        @became-source="bridgeType = '1x'"
        :coinCategory="CoinCategory.Native"
        :limit-maximum="bridgePairInfo?.amountLimitMaximum"
        :limit-minimum="bridgePairInfo?.amountLimitMinimum"
        @has-amount="(_hasAmount: boolean) => (hasAmount = _hasAmount)"
        @has-enough="(_hasEnough: boolean) => (hasEnough = _hasEnough)"
        @less-than-threshold="(_lessThanThreshold: boolean) => (lessThanThreshold = _lessThanThreshold)"
        @more-than-threshold="(_moreThanThreshold: boolean) => (moreThanThreshold = _moreThanThreshold)"
      />
      <BridgeSideWithInput
        side="pay"
        v-else-if="flipped"
        :asset="metaContractAsset"
        :calculating="calculatingPay"
        v-model:amount="token2Amount"
        @became-source="bridgeType = '2x'"
        :coinCategory="CoinCategory.MetaContract"
        :limit-maximum="bridgePairInfo?.amountLimitMaximum"
        :limit-minimum="bridgePairInfo?.amountLimitMinimum"
        @has-amount="(_hasAmount: boolean) => (hasAmount = _hasAmount)"
        @has-enough="(_hasEnough: boolean) => (hasEnough = _hasEnough)"
        @more-than-threshold="(_moreThanThreshold: boolean) => (moreThanThreshold = _moreThanThreshold)"
        @less-than-threshold="(_lessThanThreshold: boolean) => (moreThanThreshold = _lessThanThreshold)"
      />

      <div class="relative z-30 my-0.5 flex h-0 justify-center">
        <div
          class="group absolute -translate-y-1/2 rounded-xl bg-white p-1 transition-all duration-500 hover:scale-110 lg:duration-150 text-gray-line"
        >
          <ArrowDownIcon class="box-content inline h-4 w-4 rounded-lg bg-gray-soft p-2 group-hover:hidden" />

          <button
            @click="flipAsset"
            :class="[
              'box-content hidden rounded-lg bg-gray-secondary p-2 shadow-sm shadow-bridge/80 transition-all duration-500 group-hover:inline lg:duration-200',
              { 'rotate-180': flippedControl },
            ]"
          >
            <ArrowUpDownIcon class="h-4 w-4 text-bridge" />
          </button>
        </div>
      </div>

      <!-- FIXME: wbtc logo do not load -->
      <BridgeSideWithInput
        side="receive"
        v-if="!flipped"
        :asset="metaContractAsset"
        v-model:amount="token2Amount"
        :calculating="calculatingReceive"
        @became-source="bridgeType = 'x2'"
        :coinCategory="CoinCategory.MetaContract"
      />

      <BridgeSideWithInput
        side="receive"
        v-if="flipped"
        :asset="btcAsset"
        v-model:amount="token1Amount"
        :calculating="calculatingReceive"
        @became-source="bridgeType = 'x1'"
        :coinCategory="CoinCategory.Native"
      />

      <BridgePriceDisclosure
        :service-fee="serviceFee"
        :network-fee="networkFee"
        :symbol="btcAsset.symbol"
        :calculating="calculating"
        :decimal="btcAsset.decimal"
        :token1-symbol="btcAsset.symbol"
        :token2-symbol="metaContractAsset.symbol"
        v-if="!!Number(sourceAmount) && !hasUnmet"
      />

      <BridgeFrictionStats
        @fee-rate-onchange="(_currentRateFee: number) => (currentRateFee = _currentRateFee)"
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
    <RunesMainBtn v-else-if="loading" :disabled="loading" class="disabled">Loading...</RunesMainBtn>
    <RunesMainBtn v-else @click="bridge">Bridge</RunesMainBtn>

    <RouterLink
      :to="`/settings/toolkit/${bridgeType === '1x' ? 'btc' : 'space'}-merge`"
      v-if="unmet?.priority === 3"
      class="text-xs underline text-gray-primary flex items-center gap-x-1"
    >
      <span>Go to {{ bridgeType === '1x' ? 'BTC' : 'MVC' }} Merge</span>
      <QuestionMarkCircleIcon
        class="w-3.5"
        v-tooltip="'Too many UTXOs can cause transaction failures. Please use the tool to merge these UTXOs.'"
      />
    </RouterLink>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
