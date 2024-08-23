<script lang="ts" setup>
import Decimal from 'decimal.js'
import { addSafeUtxo } from '@/lib/utxo'
import { allAssets } from '@/data/assets'
import { ref, computed, watch } from 'vue'
import { Transaction } from 'bitcoinjs-lib'
import { getBtcUtxos } from '@/queries/utxos'
import { useRoute, useRouter } from 'vue-router'
import { broadcastTx } from '@/queries/transaction'
import { useIconsStore } from '@/stores/IconsStore'
import { useBalanceQuery } from '@/queries/balance'
import { useQueryClient } from '@tanstack/vue-query'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { type SymbolTicker } from '@/lib/asset-symbol'
import { prettifyBalanceFixed } from '@/lib/formatters'
import { CoinCategory } from '@/queries/exchange-rates'
import type { TransactionResult } from '@/global-types'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import TransactionResultModal from './components/TransactionResultModal.vue'
import { Chain, ScriptType, SignType, getAddressFromScript } from '@metalet/utxo-wallet-service'
import { AssetLogo, Divider, FlexBox, FeeRateSelector, Button, LoadingText } from '@/components'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'

const route = useRoute()
const recipient = ref('')
const error = ref<Error>()
const router = useRouter()
const cost = ref<number>()
const txHex = ref<string>()
const totalFee = ref<number>()
const queryClient = useQueryClient()
const currentRateFee = ref<number>()
const isOpenConfirmModal = ref(false)
const transactionResult = ref<TransactionResult>()
const address = ref(route.params.address as string)
const symbol = ref(route.params.symbol as SymbolTicker)
const asset = computed(() => allAssets.find((asset) => asset.symbol === symbol.value)!)

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.Native, route.params.symbol as SymbolTicker) || '')

const { currentBTCWallet, initMvcWallet } = useChainWalletsStore()

// amount
const amount = ref<number>()
const amountInSats = computed(() => {
  if (amount.value) {
    return new Decimal(amount.value).mul(10 ** asset.value.decimal)
  }
  return new Decimal(0)
})

// balance
const balanceQueryEnabled = computed(() => {
  return !asset.value.balance && !!address.value && !!symbol.value
})

const { data: balanceData } = useBalanceQuery(address, symbol, { enabled: balanceQueryEnabled })

const balance = computed(() => {
  if (balanceData.value) {
    return new Decimal(balanceData.value.total).div(10 ** asset.value.decimal).toNumber()
  }
})

// btn disabled
const btnDisabled = computed(() => {
  return (
    !recipient.value || !amount.value || operationLock.value || (asset.value.chain === 'btc' && !currentRateFee.value)
  )
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
      message: 'Please enter the amount.',
    }
    isOpenResultModal.value = true
    return
  }
  if (asset.value.chain === 'btc' && !currentRateFee.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please enter the current fee rate.',
    }
    isOpenResultModal.value = true
    return
  }
  if (!amountInSats.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please enter the amount.',
    }
    isOpenResultModal.value = true
    return
  }
  if (!currentRateFee.value && asset.value.chain === 'btc') {
    transactionResult.value = {
      status: 'warning',
      message: 'Please select fee rate.',
    }
    isOpenResultModal.value = true
    return
  }
  if (symbol.value === 'BTC') {
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
      const utxos = await getBtcUtxos(address.value, needRawTx, true)

      const { fee, rawTx } = currentBTCWallet.value!.signTx(SignType.SEND, {
        recipient: recipient.value.trim(),
        amount: amountInSats.value.toNumber(),
        feeRate: currentRateFee.value!,
        utxos,
      })
      cost.value = amountInSats.value.add(fee).toNumber()
      txHex.value = rawTx
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
  } else {
    const walletInstance = initMvcWallet()
    const sentRes = await walletInstance
      .send(recipient.value, amountInSats.value.toNumber(), { noBroadcast: true })
      .catch((err) => {
        isOpenConfirmModal.value = false
        transactionResult.value = {
          status: 'failed',
          message: err.message,
        }
        isOpenResultModal.value = true
      })
    if (sentRes) {
      const fee = Transaction.fromHex(sentRes.txHex).virtualSize()
      totalFee.value = fee
      cost.value = amountInSats.value.add(fee).toNumber()
      txHex.value = sentRes.txHex
    }
    isOpenConfirmModal.value = true
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

async function sendBTC(chain: Chain) {
  operationLock.value = true
  if (txHex.value) {
    const address = currentBTCWallet.value!.getAddress()
    const txId = await broadcastTx(txHex.value, chain).catch((err: Error) => {
      isOpenConfirmModal.value = false
      transactionResult.value = {
        status: 'failed',
        message: err.message,
      }
      isOpenResultModal.value = true
      operationLock.value = false
      throw err
    })
    const tx = Transaction.fromHex(txHex.value)
    if (
      tx.outs.length > 1 &&
      getAddressFromScript(tx.outs[tx.outs.length - 1].script, currentBTCWallet.value!.getNetwork()) === address
    ) {
      await addSafeUtxo(address, `${txId}:${tx.outs.length - 1}`)
    }
    return { txId }
  } else {
    isOpenConfirmModal.value = false
    transactionResult.value = {
      status: 'failed',
      message: 'No Psbt',
    }
    isOpenResultModal.value = true
    operationLock.value = false
  }
}

async function send() {
  if (operationLock.value) return

  operationLock.value = true

  const sendRes = await sendBTC(asset.value.chain as Chain)
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
  queryClient.invalidateQueries({
    queryKey: ['balance', { address: address.value, symbol: symbol.value }],
  })
  router.replace({
    name: 'SendSuccess',
    params: {
      txId: sendRes.txId,
      chain: asset.value.chain,
      symbol: symbol.value,
      amount: amount.value,
      address: recipient.value,
      coinCategory: CoinCategory.Native,
    },
  })
}
</script>

<template>
  <div v-if="asset" class="flex flex-col items-center w-full relative min-h-full">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />

    <div class="grow w-full space-y-3">
      <div class="space-y-3 w-full">
        <FlexBox d="col" ai="center" :gap="3">
          <AssetLogo
            :logo="logo"
            :symbol="symbol"
            :chain="asset.chain"
            class="w-15"
            :type="asset.isNative ? undefined : 'network'"
          />
          <div class="text-base">{{ symbol }}</div>
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
        <div class="flex items-center justify-between">
          <span>Amount</span>
          <span class="text-gray-primary text-xs">
            <span>Max:</span>
            <span v-if="balance !== undefined">
              {{ prettifyBalanceFixed(balanceData?.confirmed.toNumber() || 0, symbol, asset.decimal) }}
            </span>
            <span v-else>--</span>
          </span>
        </div>
        <input
          min="0"
          type="number"
          step="0.00001"
          v-model="amount"
          :max="Number(balanceData?.confirmed || 0)"
          class="mt-2 w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none"
        />
      </div>
      <div class="flex flex-col w-full gap-2" v-if="asset.chain === 'btc'">
        <!-- <div class="flex items-center justify-between w-full">
          <span class="text-sm">Total</span>
          <span class="text-xs text-gray-primary">
            {{ prettifyBalanceFixed(balanceData?.total.toNumber() || 0, symbol, asset.decimal) }}
          </span>
        </div> -->
        <div class="flex items-center justify-between w-full">
          <span class="text-xs text-gray-primary flex items-end gap-1">
            <span>Pending</span>
            <span
              v-tooltip="
                'Unconfirmed utxo may include inscription, brc20, rune, and future versions will support the use of these assets.'
              "
            >
              <QuestionMarkCircleIcon class="w-3.5" />
            </span>
          </span>
          <span class="text-xs text-gray-primary">
            {{ prettifyBalanceFixed(balanceData?.unconfirmed.toNumber() || 0, symbol, asset.decimal) }}
          </span>
        </div>
        <div class="flex items-center justify-between w-full">
          <span class="text-xs text-gray-primary">Available</span>
          <span class="text-xs text-gray-primary">
            {{ prettifyBalanceFixed(balanceData?.confirmed.toNumber() || 0, symbol, asset.decimal) }}
          </span>
        </div>
      </div>

      <FeeRateSelector class="w-full" v-model:currentRateFee="currentRateFee" v-if="asset.chain === 'btc'" />
      <div class="flex items-center justify-between w-full" v-else-if="asset.chain === 'mvc'">
        <span class="text-sm">Fee Rate</span>
        <span class="text-xs text-gray-primary">1 sat/vB</span>
      </div>
      <Drawer v-model:open="isOpenConfirmModal">
        <DrawerContent class="bg-white">
          <DrawerHeader>
            <FlexBox d="col" ai="center" :gap="4">
              <AssetLogo :logo="logo" :symbol="symbol" :chain="asset.chain" type="network" class="w-15" />
              <div class="text-base">{{ amount }} {{ symbol }}</div>
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
              <div class="break-all">{{ prettifyBalanceFixed(amount, symbol) }}</div>
            </FlexBox>
            <FlexBox ai="center" jc="between">
              <div class="text-gray-primary">Fees (Estimated)</div>
              <div>{{ prettifyBalanceFixed(totalFee, symbol, asset.decimal) }}</div>
            </FlexBox>
            <Divider />
            <FlexBox ai="center" jc="between">
              <div class="text-gray-primary">Total</div>
              <div>{{ prettifyBalanceFixed(cost || 0, symbol, asset.decimal) }}</div>
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
    </div>
    <Button
      type="primary"
      @click="popConfirm"
      :disabled="btnDisabled"
      :class="[{ 'opacity-50 cursor-not-allowed': btnDisabled }, 'my-6 w-61.5 h-12']"
    >
      <div class="flex items-center gap-2" v-if="operationLock">
        <LoadingIcon />
        <span>Loading...</span>
      </div>
      <span v-else>Next</span>
    </Button>
  </div>
  <LoadingText text="Asset Loading..." v-else />
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
