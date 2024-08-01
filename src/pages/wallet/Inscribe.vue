<script lang="ts" setup>
import { ref, computed } from 'vue'
import { LoadingText } from '@/components'
import Ticker from './components/Ticker.vue'
import { getBtcUtxos } from '@/queries/utxos'
import { useRoute, useRouter } from 'vue-router'
import { SymbolTicker } from '@/lib/asset-symbol'
import CopyIcon from '@/assets/icons-v3/copy.svg'
import { commitInscribe } from '@/queries/inscribe'
import { useBRC20AssetQuery } from '@/queries/brc20'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { ScriptType, SignType } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import InscribeSuccessPNG from '@/assets/icons-v3/inscribe-success.png'
import { prettifyBalanceFixed, shortestAddress } from '@/lib/formatters'
import { preInscribe, PreInscribe, getInscribeInfo } from '@/queries/inscribe'
import { FlexBox, Divider, FeeRateSelector, Button, AssetLogo } from '@/components'
import TransactionResultModal, { type TransactionResult } from './components/TransactionResultModal.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'

const route = useRoute()
const router = useRouter()

const orderId = ref()
const open = ref(false)
const rawTx = ref<string>()
const currentRateFee = ref<number>()

const { currentBTCWallet } = useChainWalletsStore()

const address = ref<string>(route.params.address as string)
const symbol = ref<SymbolTicker>(route.params.symbol as SymbolTicker)

const { getIcon } = useIconsStore()
const icon = computed(() => getIcon(CoinCategory.BRC20, route.params.symbol as SymbolTicker) || '')

const { data: asset } = useBRC20AssetQuery(address, symbol, {
  enabled: computed(() => !!address.value),
})

const availableBalance = computed(() => asset.value?.balance.availableBalance)

const nextStep = ref(0)
const operationLock = ref(false)
const isOpenResultModal = ref(false)

const copied = ref(false)
const total = ref<number>()
const inscribeAmount = ref<number>()
const paymentNetworkFee = ref<number>()
const inscribeOrder = ref<PreInscribe>()
const transactionResult = ref<TransactionResult>()

interface SimpleUTXO {
  address: string
  value: number
}
const inputUTXOs = ref<SimpleUTXO[]>()
const outputUTXOs = ref<SimpleUTXO[]>()
const copyHex = () => {
  navigator.clipboard.writeText(rawTx.value!)
  copied.value = true
}
const popConfirm = async () => {
  if (!address.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'No address.',
    }
    isOpenResultModal.value = true
    return
  }
  if (!inscribeAmount.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'No input amount.',
    }
    isOpenResultModal.value = true
    return
  }
  if (address.value !== currentBTCWallet.value?.getAddress()) {
    transactionResult.value = {
      status: 'warning',
      message: 'Address mismatch. Double-check the address.',
    }
    isOpenResultModal.value = true
    return
  }

  if (inscribeAmount.value > Number(asset.value?.balance.availableBalance || 0)) {
    transactionResult.value = {
      status: 'warning',
      message: 'Insufficient Balance.',
    }
    isOpenResultModal.value = true
    return
  }
  operationLock.value = true
  const order = await preInscribe(
    address.value,
    currentRateFee.value!,
    // TODO make it to function
    `{"p":"brc-20","op":"transfer","tick":"${asset.value!.symbol}","amt":"${inscribeAmount.value}"}`
  ).catch((err) => {
    transactionResult.value = {
      status: 'failed',
      message: err.message,
    }
    isOpenResultModal.value = true
    return
  })
  if (!order) {
    operationLock.value = false
    return
  }
  try {
    const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH
    const utxos = await getBtcUtxos(address.value, needRawTx, true)
    const {
      fee,
      txInputs,
      txOutputs,
      rawTx: _rawTx
    } = currentBTCWallet.value!.signTx(SignType.SEND, {
      recipient: order.payAddress,
      amount: order.needAmount / 1e8,
      feeRate: currentRateFee.value!,
      utxos,
    })
    rawTx.value = _rawTx
    inputUTXOs.value = txInputs
    outputUTXOs.value = txOutputs
    paymentNetworkFee.value =Number(fee) 
    inscribeOrder.value = order
    orderId.value = order.orderId
    total.value = paymentNetworkFee.value + order.needAmount
    operationLock.value = false
    nextStep.value = 1
  } catch (error) {
    transactionResult.value = {
      status: 'failed',
      message: (error as Error).message,
    }
    isOpenResultModal.value = true
  }
}

function toConfirm() {
  nextStep.value = 2
}

// TODO: add safe utxo
async function send() {
  if (operationLock.value) return
  operationLock.value = true
  try {
    let resStatus = await commitInscribe(address.value, inscribeOrder.value!.orderId, rawTx.value!)
    if (resStatus) {
      const timerId = setInterval(async () => {
        if (resStatus!.inscriptionState === 4) {
          clearInterval(timerId)
          operationLock.value = false
          open.value = true
          return
        }
        resStatus = await getInscribeInfo(inscribeOrder.value!.orderId)
      }, 1000)
    }
  } catch (error) {
    transactionResult.value = {
      status: 'failed',
      message: (error as Error).message,
    }
    isOpenResultModal.value = true
  }
}

function cancel() {
  nextStep.value = 1
}

function toOrder() {
  router.push({
    name: 'inscribe-query',
    params: { orderId: orderId.value, symbol: symbol.value, amt: inscribeAmount.value },
  })
}

const tabIdx = ref<number>(0)
const changeTabIdx = (idx: number) => {
  tabIdx.value = idx
}
</script>

<template>
  <div class="h-full" v-if="asset">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />
    <div v-if="nextStep === 0" class="h-full space-y-6 relative">
      <Ticker :ticker="asset.symbol" :amount="inscribeAmount || 0" :block="true" class="w-[104px] mx-auto" />
      <Divider />
      <div>
        <div class="flex items-center justify-between">
          <span class="text-sm">Amount</span>
          <span class="text-xs text-gray-primary">Available: {{ availableBalance }} {{ asset.symbol }}</span>
        </div>
        <input
          min="0"
          type="number"
          :max="availableBalance"
          v-model="inscribeAmount"
          class="mt-2 w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none"
        />
      </div>
      <FeeRateSelector class="mt-6" v-model:currentRateFee="currentRateFee" />

      <Button
        type="primary"
        @click="popConfirm"
        :disabled="!currentRateFee || !inscribeAmount"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 w-61.5 h-12"
        :class="!currentRateFee || !inscribeAmount || operationLock ? 'opacity-50 cursor-not-allowed' : undefined"
      >
        <FlexBox ai="center" :gap="1" v-if="operationLock">
          <LoadingIcon />
          <span>Loading...</span>
        </FlexBox>
        <span v-else>Next</span>
      </Button>
    </div>

    <div v-else-if="nextStep === 1" class="relative h-full space-y-4">
      <FlexBox d="col" ai="center" class="space-y-4 py-1">
        <AssetLogo :logo="icon" :chain="asset.chain" :symbol="asset.symbol" type="network" class="w-15" />
        <div class="text-center text-base">{{ inscribeAmount }} {{ asset.symbol }}</div>
      </FlexBox>
      <div class="space-y-2">
        <div class="text-sm">Preview</div>
        <div class="w-full h-[68px] rounded-lg bg-gray-secondary px-3 py-3.5 text-sm break-all">
          {{ `{"p":"brc-20","op":"transfer","tick":"${asset.symbol}","amt":"${inscribeAmount}"}` }}
        </div>
      </div>
      <Divider />
      <div class="mt-8 space-y-4 text-ss">
        <FlexBox ai="center" jc="between">
          <span class="label">Network Fee</span>
          <span>{{ prettifyBalanceFixed(paymentNetworkFee || 0, 'BTC', 8) }}</span>
        </FlexBox>
        <FlexBox ai="center" jc="between">
          <span class="label">Need Amount</span>
          <span>{{ prettifyBalanceFixed(inscribeOrder?.needAmount || 0, 'BTC', 8) }}</span>
        </FlexBox>
        <Divider />
        <FlexBox ai="center" jc="between">
          <span class="label">Total</span>
          <span>{{ prettifyBalanceFixed(total || 0, 'BTC', 8) }}</span>
        </FlexBox>
      </div>
      <Button
        type="primary"
        :loading="true"
        @click="toConfirm"
        :disabled="!currentRateFee || !inscribeAmount"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 w-61.5 h-12"
        :class="!currentRateFee || !inscribeAmount ? 'opacity-50 cursor-not-allowed' : undefined"
      >
        Next
      </Button>
    </div>

    <div v-else-if="nextStep === 2" class="relative h-full space-y-6">
      <div class="space-y-0.5">
        <div class="text-center text-2xl pt-2">{{ inscribeAmount }} {{ asset.symbol }}</div>
        <div class="text-center text-sm text-gray-primary">
          {{ prettifyBalanceFixed(paymentNetworkFee || 0, 'BTC', 8) }} (network fee)
        </div>
      </div>

      <div class="space-y-4">
        <!-- TODO: replace tabs with shadcn -->
        <div class="border-b mt-3 space-x-3 text-base">
          <span
            @click="changeTabIdx(0)"
            class="inline-block pb-2 border-b-2 cursor-pointer"
            :class="tabIdx === 0 ? 'border-blue-primary text-blue-primary' : 'border-white text-black-primary'"
          >
            Data
          </span>
          <span
            @click="changeTabIdx(1)"
            class="inline-block pb-2 border-b-2 cursor-pointer"
            :class="tabIdx === 1 ? 'border-blue-primary text-blue-primary' : 'border-white text-black-primary'"
          >
            Hex
          </span>
        </div>
        <div class="space-y-4 text-sm" v-show="tabIdx === 0">
          <div class="space-y-2 rounded-md">
            <div class="text-gray-primary">Inputs</div>
            <FlexBox
              ai="center"
              jc="between"
              v-for="utxo in inputUTXOs"
              class="w-full px-3 py-3.5 bg-gray-secondary rounded-lg"
            >
              <span>{{ shortestAddress(utxo.address) }}</span>
              <span>{{ prettifyBalanceFixed(utxo.value, 'BTC', 8) }}</span>
            </FlexBox>
          </div>
          <div class="space-y-2 rounded-md">
            <div class="text-gray-primary">Outputs</div>
            <FlexBox
              ai="center"
              jc="between"
              v-for="utxo in outputUTXOs"
              class="w-full px-3 py-3.5 bg-gray-secondary rounded-lg"
            >
              <span>{{ shortestAddress(utxo.address) }}</span>
              <span>{{ prettifyBalanceFixed(utxo.value, 'BTC', 8) }}</span>
            </FlexBox>
          </div>
          <div class="space-y-2 rounded-md">
            <div class="label">Network Fee</div>
            <FlexBox class="w-full px-3 py-3.5 bg-gray-secondary rounded-lg">
              {{ prettifyBalanceFixed(paymentNetworkFee || 0, 'BTC', 8) }}
            </FlexBox>
          </div>
        </div>
        <div class="space-y-[18px]" v-show="tabIdx === 1">
          <div class="space-y-2 rounded-md">
            <div class="label">Outputs</div>
            <div class="w-full p-4 bg-gray-secondary h-48 rounded-md break-all overflow-y-scroll">
              {{ rawTx }}
            </div>
          </div>
          <FlexBox ai="center" jc="center" :gap="2" class="cursor-pointer hover:text-blue-primary">
            <span class="text-sm" @click="copyHex">Copy psbt transaction data</span>
            <CopyIcon class="w-[22px]" />
          </FlexBox>
        </div>
      </div>

      <FlexBox ai="center" jc="center" :gap="2" :class="[tabIdx === 1 ? 'absolute bottom-4' : 'pb-6', 'w-full']">
        <Button type="light" @click="cancel" class="w-[119px] h-12">Cancel</Button>
        <Button type="primary" @click="send" class="w-[119px] h-12" :class="operationLock ? 'opacity-50' : undefined">
          <FlexBox ai="center" :gap="1" v-if="operationLock">
            <LoadingIcon />
            <span>Loading...</span>
          </FlexBox>
          <span v-else>Send</span>
        </Button>
      </FlexBox>
      <AlertDialog :open="open">
        <AlertDialogContent class="w-82 h-[344px] bg-white rounded-lg">
          <AlertDialogHeader>
            <FlexBox d="col" ai="center">
              <img :src="InscribeSuccessPNG" alt="Inscribe Success" class="w-22.5 mx-auto" />
              <AlertDialogTitle class="pt-3">Payment Sent</AlertDialogTitle>
              <AlertDialogDescription class="pt-1 text-center text-gray-primary">
                Your Transaction Has Been
                <br />
                Succesfully Sent
              </AlertDialogDescription>
            </FlexBox>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              <Button type="primary" @click="toOrder" class="absolute bottom-6 left-1/2 -translate-x-1/2 w-61.5 h-12">
                Confirm
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
  <LoadingText v-else text="Asset Loading..." />
</template>

<style lang="css" scoped>
.label {
  @apply text-gray-primary text-sm;
}
</style>
