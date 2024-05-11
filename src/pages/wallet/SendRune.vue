<script lang="ts" setup>
import Decimal from 'decimal.js'
import { Psbt } from 'bitcoinjs-lib'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIconsStore } from '@/stores/IconsStore'
import { useRuneDetailQuery } from '@/queries/runes'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { broadcastBTCTx } from '@/queries/transaction'
import { CoinCategory } from '@/queries/exchange-rates'
import { prettifyBalanceFixed } from '@/lib/formatters'
import type { TransactionResult } from '@/global-types'
import { getBtcUtxos, getRuneUtxos } from '@/queries/utxos'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { ScriptType, SignType } from '@metalet/utxo-wallet-service'
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

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.Rune, route.params.runeId as string) || '')

const { isLoading: isRuneDetailLoading, data: asset } = useRuneDetailQuery(address, runeId, {
  enabled: computed(() => !!address.value && !!runeId.value),
})

const { currentBTCWallet } = useChainWalletsStore()

// amount
const amount = ref<number>()

const balance = computed(() => {
  if (asset.value?.balance) {
    return new Decimal(asset.value.balance.total).div(10 ** asset.value.decimal).toNumber()
  }
})

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
    const runeUtxos = await getRuneUtxos(address.value, asset.value!.runeId, needRawTx)
    const { fee, psbt } = currentBTCWallet.value!.signTx(SignType.RUNE_SEND, {
      utxos,
      runeId: runeId.value,
      feeRate: currentRateFee.value,
      recipient: recipient.value,
      runeUtxos,
      runeAmount: amount.value.toString(),
      divisibility: asset.value!.decimal,
    }) as {
      psbt: Psbt
      fee: string
    }
    txPsbt.value = psbt
    totalFee.value = Number(fee)
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

const isOpenResultModal = ref(false)

const operationLock = ref(false)

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
      coinCategory: CoinCategory.Rune,
    },
  })
}
</script>

<template>
  <FlexBox d="col" ai="center" v-if="asset" class="w-full h-full relative space-y-6">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />

    <div class="space-y-4 w-full">
      <FlexBox d="col" ai="center" :gap="3">
        <AssetLogo :logo="logo" :symbol="asset.symbol" :chain="asset.chain" type="network" class="w-15" />
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
            <AssetLogo :logo="logo" :symbol="asset.symbol" :chain="asset.chain" type="network" class="w-15" />
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
            <div>{{ prettifyBalanceFixed(totalFee, 'BTC', 8) }}</div>
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
