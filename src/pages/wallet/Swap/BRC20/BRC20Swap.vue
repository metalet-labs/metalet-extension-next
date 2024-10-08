<script lang="ts" setup>
import Decimal from 'decimal.js'
import { useI18n } from 'vue-i18n'
import Building from './Building.vue'
import { ERRORS } from '@/data/errors'
import { BTCAsset } from '@/data/assets'
import { toast } from '@/components/ui/toast'
import RunesMainBtn from './RunesMainBtn.vue'
import { getRuneUtxos } from '@/queries/utxos'
import { swapTokens } from '@/data/pinned-tokens'
import useBRC20Pool from '@/hooks/swap/useBRC20Pool'
import { useBRC20AssetQuery } from '@/queries/brc20'
import EmptyPoolMessage from './EmptyPoolMessage.vue'
import { useBTCBalanceQuery } from '@/queries/balance'
import { CoinCategory } from '@/queries/exchange-rates'
import { computed, ref, toRaw, watchEffect } from 'vue'
import Brc20ModalTokenSelect from './Brc20ModalTokenSelect.vue'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import BRC20SwapSideWithInput from './BRC20SwapSideWithInput.vue'
import RunesSwapFrictionStats from './RunesSwapFrictionStats.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useOngoingTask } from '@/hooks/swap/use-runes-ongoing-task'
import RunesSwapPriceDisclosure from './RunesSwapPriceDisclosure.vue'
import BridgeHistory from '../../Bridge/components/BridgeHistory.vue'
import { usePoolStatusQuery } from '@/queries/brc20/pool-status.query'
import { useBuildingOverlay } from '@/hooks/swap/use-building-overlay'
import RunesSwapOngoingTaskModal from './Brc20SwapOngoingTaskModal.vue'
import { ArrowDownIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-vue-next'
import {
  SwapType,
  previewSwap,
  signSwapPsbt,
  RuneUtxoRefined,
  usePostSwapMutation,
  useBuildSwapMutation,
} from '@/queries/brc20/swap'

const hasEnough = ref(true)
const hasAmount = ref(false)
const lowLiquidity = ref(false)
const flippedControl = ref(false)
const calculatingPay = ref(false)
const token1Amount = ref<string>()
const token2Amount = ref<string>()
const returnIsNegative = ref(false)
const lessThanThreshold = ref(true)
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

const { t } = useI18n()
const { getAddress, currentBTCWallet } = useChainWalletsStore()

const address = getAddress(Chain.BTC)

const { token1, token2 } = useBRC20Pool()

const balanceEnabled = computed(() => {
  return !!address.value && !!symbol.value
})

const { data: balance } = useBTCBalanceQuery(address, { enabled: balanceEnabled })

const btcAsset = computed(() => {
  if (balance.value) {
    return { ...BTCAsset, balance: toRaw(balance.value) }
  }
  return BTCAsset
})

const { data: brc20Asset } = useBRC20AssetQuery(address, token2, {
  enabled: computed(() => !!address.value && !!token2.value),
})

const { data: poolStatus } = usePoolStatusQuery(
  address,
  token1,
  token2,
  computed(() => !!address.value && !!token1.value && !!token2.value)
)

const isEmpty = computed(() => {
  if (!poolStatus.value) return false
  return Number(poolStatus.value.poolEquity) <= 0
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
    message: t('SwapPage.conditions.InsufficientLiquidity'),
    priority: 0,
    met: false,
  },
  {
    condition: 'enter-amount',
    message: t('SwapPage.conditions.EnterAmount'),
    priority: 1,
    met: false,
  },
  {
    condition: 'insufficient-balance',
    message: t('SwapPage.conditions.InsufficientBalance'),
    priority: 2,
    met: false,
  },
  {
    condition: 'less-than-threshold',
    message: t('SwapPage.conditions.LessThanThreshold'),
    priority: 3,
    met: false,
  },
  {
    condition: 'return-is-positive',
    message: t('SwapPage.conditions.ReturnIsPositive'),
    priority: 4,
    met: false,
  },
])

const hasUnmet = computed(() =>
  conditions.value.filter(({ condition }) => condition !== 'return-is-positive').every((c) => !c.met)
)

const clear = () => {
  hasAmount.value = false
  token1Amount.value = undefined
  token2Amount.value = undefined
  lessThanThreshold.value = false
}

const firstMet = computed(() => conditions.value.filter((c) => c.met).sort((a, b) => a.priority - b.priority)[0])

const flipAsset = async () => {
  flippedControl.value = !flippedControl.value

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

  clear()
}

const sourceAmount = computed(() => {
  if (swapType.value.includes('1')) {
    return token1Amount.value
  } else {
    return token2Amount.value
  }
})

const targetAmount = computed({
  get() {
    return swapType.value.includes('1') ? token2Amount.value : token1Amount.value
  },
  set(value) {
    if (swapType.value.includes('1')) {
      token2Amount.value = value
    } else {
      token1Amount.value = value
    }
  },
})

watchEffect(() => {
  conditions.value.forEach((c) => {
    if (c.condition === 'insufficient-liquidity') {
      c.met = isEmpty.value || lowLiquidity.value
    }
    if (c.condition === 'enter-amount') {
      c.met = !sourceAmount.value
    }
    if (c.condition === 'insufficient-balance') {
      c.met = !hasEnough.value
    }
    if (c.condition === 'less-than-threshold') {
      c.met = lessThanThreshold.value
    }
    if (c.condition === 'return-is-positive') {
      c.met = returnIsNegative.value
    }
  })
})

watchEffect(async () => {
  if (!sourceAmount.value) {
    token1Amount.value = undefined
    token2Amount.value = undefined
    return
  }
  if (Number(sourceAmount.value) === 0) {
    return
  }

  if (swapType.value.indexOf('x') === 0) {
    calculatingPay.value = true
  } else {
    calculatingReceive.value = true
  }

  await previewSwap({
    address: address.value,
    swapType: swapType.value,
    sourceAmount: sourceAmount.value,
    token1: token1.value.toLowerCase(),
    token2: token2.value.toLowerCase(),
  })
    .then((preview) => {
      ratio.value = new Decimal(preview.ratio)
      targetAmount.value = preview.targetAmount
      poolRatio.value = new Decimal(preview.poolRatio)
      serviceFee.value = new Decimal(preview.serviceFee)
      priceImpact.value = new Decimal(preview.priceImpact)
    })
    .catch((error) => {
      if (error.message === 'Insufficient liquidity for this trade.') {
        lowLiquidity.value = true
        targetAmount.value = undefined
      } else {
        console.log('brc20 swap error', error)
      }
    })
    .finally(() => {
      calculatingPay.value = false
      calculatingReceive.value = false
    })
})

const { pushOngoing } = useOngoingTask()
const { openBuilding, closeBuilding } = useBuildingOverlay()
const { mutateAsync: mutatePostSwap } = usePostSwapMutation()
const { mutateAsync: mutateBuildSwap } = useBuildSwapMutation(swapType)

async function doSwap() {
  openBuilding()

  const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH
  let runeUtxos = [] as RuneUtxoRefined[]

  if (swapType.value.includes('2')) {
    runeUtxos = (await getRuneUtxos(address.value, token2.value, needRawTx)).map((utxo) => ({
      satoshis: utxo.satoshis,
      runePosition: `${utxo.txId}i${utxo.outputIndex}`,
      amount: utxo.runes.reduce((acc, cur) => acc.add(cur.amount), new Decimal(0)).toString(),
    }))
    if (runeUtxos.length === 0) {
      toast({ toastType: 'warning', title: ERRORS.NO_RUNES })
      return
    }
  }

  if (!currentRateFee.value) {
    toast({ toastType: 'warning', title: ERRORS.HAVE_NOT_CHOOSE_GAS_RATE })
    return
  }

  const { rawPsbt, buildId } = await mutateBuildSwap({
    runeUtxos,
    address: address.value,
    feeRate: currentRateFee.value,
    sourceAmount: sourceAmount.value!,
    token1: token1.value.toLowerCase(),
    token2: token2.value.toLowerCase(),
    pubkey: currentBTCWallet.value!.getPublicKey().toString('hex'),
  }).catch((error) => {
    toast({ toastType: 'fail', title: error.message })
    closeBuilding()
    throw error
  })

  const psbtHex = await signSwapPsbt({
    rawPsbt,
    type: swapType.value,
    feeRate: currentRateFee.value,
    btcWallet: currentBTCWallet.value!,
  })

  await mutatePostSwap({
    buildId,
    rawPsbt: psbtHex,
    address: address.value,
  })

  closeBuilding()
  pushOngoing(buildId)
  clear()
}
</script>

<template>
  <div class="flex flex-col items-center gap-y-4">
    <Building />
    <RunesSwapOngoingTaskModal :asset="brc20Asset" v-if="brc20Asset" />
    <div class="flex flex-row-reverse w-full items-center justify-between h-8">
      <BridgeHistory protocolType="btc" :bridgeType="swapType === '1x' ? 'mint' : 'redeem'" />
      <Brc20ModalTokenSelect :pinned-tokens="swapTokens" :btcAsset="btcAsset" />
    </div>
    <div class="w-full">
      <BRC20SwapSideWithInput
        v-if="!flipped"
        :asset="btcAsset"
        :disabled="isEmpty"
        :side="$t('Common.Pay')"
        :calculating="calculatingPay"
        v-model:amount="token1Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
        @became-source="swapType = '1x'"
        @amount-entered="hasAmount = true"
        @amount-cleared="hasAmount = false"
        :coinCategory="CoinCategory.Native"
        @less-than-threshold="(_lessThanThreshold: boolean) => (lessThanThreshold = _lessThanThreshold)"
      />
      <BRC20SwapSideWithInput
        :asset="brc20Asset"
        :disabled="isEmpty"
        v-else-if="flipped"
        :side="$t('Common.Pay')"
        :calculating="calculatingPay"
        v-model:amount="token2Amount"
        @has-enough="hasEnough = true"
        @not-enough="hasEnough = false"
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
            :disabled="isEmpty"
            :class="[
              'box-content hidden rounded-lg bg-gray-secondary p-2 shadow-sm shadow-brc20/80 transition-all duration-500 group-hover:inline lg:duration-200',
              { 'rotate-180': flippedControl },
              { 'cursor-not-allowed': isEmpty },
            ]"
          >
            <ArrowUpDownIcon class="h-4 w-4 text-brc20" />
          </button>
        </div>
      </div>

      <BRC20SwapSideWithInput
        v-if="!flipped"
        :asset="brc20Asset"
        :disabled="isEmpty"
        :side="$t('Common.Receive')"
        v-model:amount="token2Amount"
        @became-source="swapType = 'x2'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.Runes"
      />

      <BRC20SwapSideWithInput
        v-if="flipped"
        :asset="btcAsset"
        :disabled="isEmpty"
        :side="$t('Common.Receive')"
        v-model:amount="token1Amount"
        @became-source="swapType = 'x1'"
        :calculating="calculatingReceive"
        :coinCategory="CoinCategory.Native"
        @less-than-threshold="(_lessThanThreshold: boolean) => (lessThanThreshold = _lessThanThreshold)"
      />

      <EmptyPoolMessage v-if="isEmpty" class="mt-2" />

      <RunesSwapPriceDisclosure
        :ratio="ratio"
        :rune="brc20Asset"
        :pool-ratio="poolRatio"
        :token1-symbol="token1"
        :token2-symbol="token2"
        :service-fee="serviceFee"
        :calculating="calculating"
        :price-impact="priceImpact"
        :has-impact-warning="hasImpactWarning"
        v-if="brc20Asset && !!Number(sourceAmount) && hasUnmet"
      />

      <RunesSwapFrictionStats
        :task-type="swapType"
        :service-fee="serviceFee"
        :token-1-amount="token1Amount"
        v-if="!!Number(sourceAmount) && hasUnmet"
        @fee-rate-onchange="(_currentRateFee: number) => (currentRateFee = _currentRateFee)"
        @return-became-negative="(_returnIsNegative: boolean) => (returnIsNegative = _returnIsNegative)"
      />
    </div>

    <RunesMainBtn class="disabled" v-if="calculating" :disabled="true">
      <Loader2Icon class="mx-auto animate-spin text-zinc-400" />
    </RunesMainBtn>

    <RunesMainBtn
      v-else-if="firstMet"
      :disabled="!firstMet.handler"
      :class="[!firstMet?.handler && 'disabled']"
      @click="!!firstMet?.handler && firstMet?.handler()"
    >
      {{ firstMet.message || '' }}
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
