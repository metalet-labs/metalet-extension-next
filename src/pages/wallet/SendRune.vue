<script lang="ts" setup>
import Decimal from 'decimal.js'
import { Psbt } from 'bitcoinjs-lib'
import { ref, computed, watch } from 'vue'
import { getBtcUtxos } from '@/queries/utxos'
import { useRoute, useRouter } from 'vue-router'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { broadcastBTCTx } from '@/queries/transaction'
import { prettifyBalanceFixed } from '@/lib/formatters'
import type { TransactionResult } from '@/global-types'
import { ScriptType } from '@metalet/utxo-wallet-service'
import { useRuneDetailQuery } from '@/queries/runes'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TransactionResultModal from './components/TransactionResultModal.vue'
import { AssetLogo, Divider, FlexBox, FeeRateSelector, Button, LoadingText } from '@/components'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'

const cost = ref()
const route = useRoute()
const recipient = ref('')
const error = ref<Error>()
const router = useRouter()
const txPsbt = ref<Psbt>()
const totalFee = ref<number>()
const currentRateFee = ref<number>()
const isOpenConfirmModal = ref(false)
const transactionResult = ref<TransactionResult>()

const runeId = ref(route.params.runeId as string)
const address = ref(route.params.address as string)

const { isLoading: isRuneDetailLoading, data: asset } = useRuneDetailQuery(address, runeId, {
  enabled: computed(() => !!address.value && !!runeId.value),
})

const { currentBTCWallet, initMvcWallet } = useChainWalletsStore()

// amount
const amount = ref<number>()
const amountInSats = computed(() => {
  if (amount.value) {
    return new Decimal(amount.value).mul(10 ** asset.value!.decimal)
  }
  return new Decimal(0)
})

const balance = computed(() => {
  if (asset.value?.balance) {
    return new Decimal(asset.value.balance.total).div(10 ** asset.value.decimal).toNumber()
  }
})

// btn disabled
const btnDisabled = computed(() => {
  return !recipient.value || !amount.value || operationLock.value || !currentRateFee.value
})

const popConfirm = async () => {
  if (!recipient.value) {
    transactionResult.value = {
      status: 'warning',
      message: "Please input recipient's address.",
    }
    isOpenResultModal.value = true
    return
  }
  if (!amount.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please input amount.',
    }
    isOpenResultModal.value = true
    return
  }
  if (asset.value!.chain === 'btc' && !currentRateFee.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please input current rate fee.',
    }
    isOpenResultModal.value = true
    return
  }
  if (!amountInSats.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please input amount.',
    }
    isOpenResultModal.value = true
    return
  }
  if (!currentRateFee.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please select fee rate.',
    }
    isOpenResultModal.value = true
    return
  }
  operationLock.value = true
  if (address.value !== currentBTCWallet.value!.getAddress()) {
    transactionResult.value = {
      status: 'warning',
      message: 'You are not the owner of this address.',
    }
    isOpenResultModal.value = true
    operationLock.value = false
    return
  }
  try {
    const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH
    const utxos = await getBtcUtxos(address.value, needRawTx)
    const {
      fee,
      psbt,
      cost: _cost,
    } = currentBTCWallet.value!.send(recipient.value, amount.value.toString(), currentRateFee.value!, utxos)
    cost.value = _cost
    txPsbt.value = psbt
    totalFee.value = fee
    isOpenConfirmModal.value = true
  } catch (error) {
    console.error('Error in BTC transaction:', error)
    transactionResult.value = {
      status: 'failed',
      message: error as string,
    }
    isOpenResultModal.value = true
  } finally {
    operationLock.value = false
  }
}

watch(amountInSats, (newAmountInSats) => {
  if (balance.value && newAmountInSats && newAmountInSats.gt(balance.value || 0)) {
    error.value = new Error('Insufficient balance')
  } else {
    error.value = undefined
  }
})

const isOpenResultModal = ref(false)

const operationLock = ref(false)

async function sendSpace() {
  // const walletInstance = toRaw(wallet.value)

  const walletInstance = initMvcWallet()
  const sentRes = await walletInstance.send(recipient.value, amountInSats.value.toNumber()).catch((err) => {
    isOpenConfirmModal.value = false
    transactionResult.value = {
      status: 'failed',
      message: err.message,
    }
    isOpenResultModal.value = true
  })

  return sentRes
}

async function sendBTC() {
  if (txPsbt.value) {
    const txId = await broadcastBTCTx(txPsbt.value.extractTransaction().toHex()).catch((err: Error) => {
      isOpenConfirmModal.value = false
      transactionResult.value = {
        status: 'failed',
        message: err.message,
      }
      isOpenResultModal.value = true
      operationLock.value = false
      throw err
    })
    return { txId }
  } else {
    isOpenConfirmModal.value = false
    transactionResult.value = {
      status: 'failed',
      message: 'No Psbt',
    }
    isOpenResultModal.value = true
  }
}

async function send() {
  if (operationLock.value) return

  operationLock.value = true

  const sendProcessor = sendBTC
  const sendRes = await sendProcessor()
  if (!sendRes || !sendRes.txId) {
    transactionResult.value = {
      status: 'failed',
      message: 'Send failed',
    }
    operationLock.value = false
    return
  }

  isOpenConfirmModal.value = false
  operationLock.value = false
  router.replace({
    name: 'SendSuccess',
    params: {
      txId: sendRes.txId,
      chain: 'btc',
      symbol: asset.value!.symbol,
      amount: amount.value,
      address: recipient.value,
    },
  })
}
</script>

<template>
  <FlexBox d="col" ai="center" v-if="asset" class="w-full h-full relative space-y-6">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />

    <div class="space-y-4 w-full">
      <FlexBox d="col" ai="center" :gap="3">
        <AssetLogo :logo="asset?.logo" :symbol="asset.symbol" :chain="asset.chain" type="network" class="w-15" />
        <div class="text-base">{{ asset.tokenName }}</div>
      </FlexBox>

      <Divider />
    </div>

    <div class="space-y-2 w-full">
      <div>Receiver</div>
      <textarea
        v-model="recipient"
        class="w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none break-all"
      />
    </div>

    <div class="space-y-2 w-full">
      <FlexBox ai="center" jc="between">
        <span>Amount</span>
        <span class="text-gray-primary text-xs">
          <span>Balance:</span>
          <span v-if="balance">{{ balance }} {{ asset.symbol }}</span>
          <span v-else>--</span>
        </span>
      </FlexBox>
      <input
        min="0"
        type="number"
        step="0.00001"
        :max="balance"
        v-model="amount"
        class="mt-2 w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none"
      />
    </div>

    <FeeRateSelector class="w-full" v-model:currentRateFee="currentRateFee" v-if="asset.chain === 'btc'" />

    <Button
      type="primary"
      @click="popConfirm"
      :disabled="btnDisabled"
      :class="[
        { 'opacity-50 cursor-not-allowed': btnDisabled },
        'absolute bottom-4 left-1/2 -translate-x-1/2 w-61.5 h-12',
      ]"
    >
      <div class="flex items-center gap-2" v-if="operationLock">
        <LoadingIcon />
        <span>Loading...</span>
      </div>
      <span v-else>Next</span>
    </Button>

    <Drawer v-model:open="isOpenConfirmModal">
      <DrawerContent class="bg-white">
        <DrawerHeader>
          <FlexBox d="col" ai="center" :gap="4">
            <AssetLogo :logo="asset.logo" :symbol="asset.symbol" :chain="asset.chain" type="network" class="w-15" />
            <div class="text-base">{{ amount }} {{ asset.symbol }}</div>
          </FlexBox>
        </DrawerHeader>
        <Divider class="mt-2" />
        <div class="p-4 space-y-4 text-ss">
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">From</div>
            <div class="break-all w-[228px]">{{ address }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">To</div>
            <div class="break-all w-[228px]">{{ recipient }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">Amount</div>
            <div class="break-all">{{ prettifyBalanceFixed(amount, asset.symbol) }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">Fees (Estimated)</div>
            <div>{{ prettifyBalanceFixed(totalFee, asset.symbol, asset.decimal) }}</div>
          </FlexBox>
          <Divider />
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">Total</div>
            <div>{{ prettifyBalanceFixed(cost || 0, asset.symbol, asset.decimal) }}</div>
          </FlexBox>
        </div>
        <DrawerFooter>
          <FlexBox ai="center" jc="center" :gap="2">
            <DrawerClose>
              <Button type="light" class="w-[119px] h-12" @click="operationLock = false">Cancel</Button>
            </DrawerClose>
            <Button
              @click="send"
              type="primary"
              :class="['w-[119px] h-12', { 'opacity-50 cursor-not-allowed space-x-1': btnDisabled }]"
            >
              <LoadingIcon v-if="operationLock" />
              <span>Confirm</span>
            </Button>
          </FlexBox>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </FlexBox>
  <LoadingText text="Asset Loading..." v-else />
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
