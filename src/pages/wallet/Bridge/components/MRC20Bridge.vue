<script lang="ts" setup>
import Decimal from 'decimal.js'
import { useRouter } from 'vue-router'
import RunesMainBtn from './RunesMainBtn.vue'
import { toast } from '@/components/ui/toast'
import { calcBalance } from '@/lib/formatters'
import { Protocol } from '@/lib/types/protocol'
import { SwapType } from '@/queries/runes/swap'
import BridgeHistory from './BridgeHistory.vue'
import { computed, ref, watchEffect } from 'vue'
import { Chain } from '@metalet/utxo-wallet-service'
import { useBridgeInfoQuery } from '@/queries/bridge'
import { useMRC20DetailQuery } from '@/queries/mrc20'
import { CoinCategory } from '@/queries/exchange-rates'
import BridgeSideWithInput from './BridgeSideWithInput.vue'
import BridgeFrictionStats from './BridgeFrictionStats.vue'
import { assetReqReturnType } from '@/queries/types/bridge'
import { useMetaContractAssetsQuery } from '@/queries/tokens'
import { MetaContractAsset, MRC20Asset } from '@/data/assets'
import BridgePriceDisclosure from './BridgePriceDisclosure.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import BridgeSelectPairs from '../components/BridgeSelectPairs.vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import { calcMintMRC20Info, calcPriceRange, calcRedeemMrc20Info, mintMrc20, redeemMrc20 } from '@/lib/bridge-utils'

const router = useRouter()
const loading = ref(false)
const hasAmount = ref(false)
const hasEnough = ref(false)
const serviceFee = ref<string>()
const networkFee = ref<string>()
const flippedControl = ref(false)
const calculatingPay = ref(false)
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const currentRateFee = ref<number>()
const moreThanThreshold = ref(false)
const lessThanThreshold = ref(false)
const calculatingReceive = ref(false)
const bridgeType = ref<SwapType>('1x')
const flipped = computed(() => ['2x', 'x1'].includes(bridgeType.value))
const calculating = computed(() => calculatingPay.value || calculatingReceive.value)

const { getAddress, currentBTCWallet, currentMVCWallet } = useChainWalletsStore()

const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)
const selectedPair = ref<assetReqReturnType>()
const mrc20Id = computed(() => selectedPair.value?.originTokenId || '')
const genesis = computed(() => selectedPair.value?.targetTokenGenesis || '')
const codeHash = computed(() => selectedPair.value?.targetTokenCodeHash || '')

const { data: bridgePairInfo } = useBridgeInfoQuery()

const { data: _mrc20Asset } = useMRC20DetailQuery(btcAddress, mrc20Id, {
  enabled: computed(() => !!btcAddress.value && !!mrc20Id.value),
})

const mrc20Asset = computed(
  () =>
    _mrc20Asset.value ||
    ({
      symbol: selectedPair.value?.originSymbol,
      tokenName: selectedPair.value?.originName,
      isNative: false,
      chain: 'btc',
      queryable: true,
      decimal: selectedPair.value?.decimals,
      balance: {
        confirmed: new Decimal(0),
        unconfirmed: new Decimal(0),
        total: new Decimal(0),
      },
      contract: CoinCategory.MRC20,
      protocol: Protocol.MRC20,
      mrc20Id: mrc20Id.value,
      deployAddress: '',
      deployName: '',
      deployAvatar: '',
    } as MRC20Asset)
)

const bridgePairs = computed(() =>
  bridgePairInfo.value?.assetList.filter((item) => item.network === 'MRC20' && item.price && item.decimals <= 8)
)

const { data: metaContractAssets } = useMetaContractAssetsQuery(mvcAddress, {
  genesis,
  codehash: codeHash,
  enabled: computed(() => !!mvcAddress.value && !!codeHash.value && !!genesis.value),
  autoRefresh: computed(() => !!mvcAddress.value && !!codeHash.value && !!genesis.value),
})

const metaContractAsset = computed(() => {
  if (metaContractAssets.value?.length) {
    return metaContractAssets.value[0]
  } else {
    return {
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
    } as MetaContractAsset
  }
})

const amountLimitInfo = computed(() => {
  if (bridgePairInfo.value && selectedPair.value && mrc20Asset.value) {
    return calcPriceRange(bridgePairInfo.value, selectedPair.value)
  }
})

const sourceAmount = computed(() => {
  return bridgeType.value.includes('1') ? token1Amount.value : token2Amount.value
})

const sourceSymbol = computed(() => {
  return bridgeType.value.includes('1') ? mrc20Asset.value.symbol : (metaContractAsset.value?.symbol ?? '')
})

const bridge = async () => {
  loading.value = true
  try {
    if (
      sourceAmount.value &&
      selectedPair.value &&
      bridgePairInfo.value &&
      currentBTCWallet.value &&
      currentMVCWallet.value &&
      metaContractAsset.value
    ) {
      if (bridgeType.value.includes('1')) {
        const { txId, recipient } = bridgeType.value.includes('1')
          ? await mintMrc20(
              new Decimal(sourceAmount.value).toNumber(),
              selectedPair.value,
              currentBTCWallet.value.getScriptType(),
              currentBTCWallet.value,
              currentMVCWallet.value,
              bridgePairInfo.value.feeBtc
            )
          : await redeemMrc20(
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
    condition: 'less-than-threshold',
    message: 'Amount too small',
    priority: 3,
    met: false,
  },
  {
    condition: 'more-than-threshold',
    message: 'Amount too large',
    priority: 4,
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
  } else if (sourceAmount.value && bridgePairInfo.value && selectedPair.value) {
    calculatingReceive.value = true
    try {
      if (bridgeType.value.includes('1')) {
        const info = calcMintMRC20Info(
          new Decimal(sourceAmount.value).toNumber(),
          bridgePairInfo.value,
          selectedPair.value
        )
        serviceFee.value = new Decimal(info.bridgeFee).toFixed(selectedPair.value.decimals)
        networkFee.value = new Decimal(info.minerFee).toFixed(selectedPair.value.decimals)

        token2Amount.value = new Decimal(10).pow(metaContractAsset.value!.decimal).mul(info.receiveAmount).toFixed()
      } else {
        const info = calcRedeemMrc20Info(
          new Decimal(sourceAmount.value).toNumber(),
          bridgePairInfo.value,
          selectedPair.value
        )
        serviceFee.value = new Decimal(info.bridgeFee).toFixed(selectedPair.value.decimals)
        networkFee.value = new Decimal(info.minerFee).toFixed(selectedPair.value.decimals)
        token1Amount.value = new Decimal(10).pow(mrc20Asset.value!.decimal).mul(info.receiveAmount).toFixed()
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
      <BridgeHistory protocolType="mrc20" :bridgeType="bridgeType === '1x' ? 'mint' : 'redeem'" />
      <BridgeSelectPairs :bridgePairs="bridgePairs" v-model:selectedPair="selectedPair" />
    </div>
    <div class="w-full">
      <BridgeSideWithInput
        v-if="!flipped"
        :asset="mrc20Asset"
        :side="$t('Common.Pay')"
        :calculating="calculatingPay"
        v-model:amount="token1Amount"
        @became-source="bridgeType = '1x'"
        :coinCategory="CoinCategory.MRC20"
        :limit-maximum="amountLimitInfo?.amountLimitMaximum"
        :limit-minimum="amountLimitInfo?.amountLimitMinimum"
        @has-amount="(_hasAmount) => (hasAmount = _hasAmount)"
        @has-enough="(_hasEnough) => (hasEnough = _hasEnough)"
        @less-than-threshold="(_lessThanThreshold) => (lessThanThreshold = _lessThanThreshold)"
        @more-than-threshold="(_moreThanThreshold) => (moreThanThreshold = _moreThanThreshold)"
      />
      <BridgeSideWithInput
        v-else-if="flipped"
        :side="$t('Common.Pay')"
        :asset="metaContractAsset"
        :calculating="calculatingPay"
        v-model:amount="token2Amount"
        @became-source="bridgeType = '2x'"
        :coinCategory="CoinCategory.MetaContract"
        :limit-maximum="amountLimitInfo?.amountLimitMaximum"
        :limit-minimum="amountLimitInfo?.amountLimitMinimum"
        @has-amount="(_hasAmount) => (hasAmount = _hasAmount)"
        @has-enough="(_hasEnough) => (hasEnough = _hasEnough)"
        @less-than-threshold="(_lessThanThreshold) => (lessThanThreshold = _lessThanThreshold)"
        @more-than-threshold="(_moreThanThreshold) => (moreThanThreshold = _moreThanThreshold)"
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
            <ArrowUpDownIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <BridgeSideWithInput
        v-if="!flipped"
        :asset="metaContractAsset"
        :side="$t('Common.Receive')"
        v-model:amount="token2Amount"
        :calculating="calculatingReceive"
        @became-source="bridgeType = 'x2'"
        :coinCategory="CoinCategory.MetaContract"
      />

      <BridgeSideWithInput
        v-if="flipped"
        :asset="mrc20Asset"
        :side="$t('Common.Receive')"
        v-model:amount="token1Amount"
        :calculating="calculatingReceive"
        @became-source="bridgeType = 'x1'"
        :coinCategory="CoinCategory.MRC20"
      />

      <BridgePriceDisclosure
        :symbol="sourceSymbol"
        :service-fee="serviceFee"
        :network-fee="networkFee"
        :calculating="calculating"
        :decimal="selectedPair?.decimals"
        :token1-symbol="mrc20Asset!.symbol"
        :token2-symbol="metaContractAsset.symbol"
        v-if="!!Number(sourceAmount) && !hasUnmet && metaContractAsset"
      />

      <BridgeFrictionStats
        :task-type="bridgeType"
        @fee-rate-onchange="(_currentRateFee) => (currentRateFee = _currentRateFee)"
        :limit-minimum="
          calcBalance(
            Number(amountLimitInfo?.amountLimitMinimum),
            mrc20Asset?.decimal || 8,
            mrc20Asset?.symbol || 'BTC'
          )
        "
        :limit-maximum="
          calcBalance(
            Number(amountLimitInfo?.amountLimitMaximum),
            mrc20Asset?.decimal || 8,
            mrc20Asset?.symbol || 'BTC'
          )
        "
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

    <RunesMainBtn v-else-if="loading" :disabled="loading" :class="['disabled']">Loading...</RunesMainBtn>

    <!-- confirm button -->
    <RunesMainBtn v-else @click="bridge">Bridge</RunesMainBtn>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
