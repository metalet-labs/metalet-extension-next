<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Copy from '@/components/Copy.vue'
import { getBtcUtxos } from '@/queries/utxos'
import { getMetaPin } from '@/queries/metaPin'
import { FeeRateSelector } from '@/components'
import { useQueryClient } from '@tanstack/vue-query'
import { broadcastBTCTx } from '@/queries/transaction'
import { ScriptType } from '@metalet/utxo-wallet-service'
import { UTXO, getInscriptionUtxo } from '@/queries/utxos'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { prettifyBalanceFixed, shortestAddress } from '@/lib/formatters'
import TransactionResultModal, { type TransactionResult } from '../wallet/components/TransactionResultModal.vue'

const route = useRoute()
const queryClient = useQueryClient()
const { currentBTCWallet } = useChainWalletsStore()

const id = ref(route.params.id as string)
const nftType = route.params.nftType as string
const imgUrl = ref(route.query.imgUrl as string)
const content = ref(route.query.content as string)
const satoshis = ref(route.query.satoshis as string)
const address = ref<string>(route.params.address as string)

const symbol = 'BTC'
const amount = ref(0)

const recipient = ref('')

const operationLock = ref(false)
const currentRateFee = ref<number>()
const calcFee = ref<number>()
const rawTx = ref<string>()

const isOpenResultModal = ref(false)
const isShowComfirm = ref(false)

function cancel() {
  isShowComfirm.value = false
}

const transactionResult = ref<TransactionResult | undefined>()

async function next() {
  if (operationLock.value) return

  if (!currentRateFee.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please select fee rate.',
    }
    isOpenResultModal.value = true
    return
  }

  operationLock.value = true

  let utxo: UTXO
  const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH

  if (nftType === 'brc20') {
    utxo = await getInscriptionUtxo(id.value, needRawTx)
  } else if (nftType === 'metaPin') {
    const metaPin = await getMetaPin(id.value, needRawTx)
    const [txId, outputIndex] = metaPin.output.split(':')
    utxo = {
      txId,
      outputIndex: Number(outputIndex),
      satoshis: metaPin.outputValue,
      confirmed: metaPin.genesisHeight > 0,
      inscriptions: null,
      rawTx: metaPin.rawTx,
    }
  } else {
    throw new Error('Unknown nft type')
  }

  amount.value = utxo.satoshis

  try {
    const utxos = await getBtcUtxos(address.value, needRawTx)
    const { fee, rawTx: _rawTx } = currentBTCWallet.value!.sendBRC20(
      recipient.value,
      [utxo],
      currentRateFee.value!,
      utxos
    )

    rawTx.value = _rawTx
    calcFee.value = fee
    isShowComfirm.value = true
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

async function send() {
  if (!rawTx.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'No Psbt.',
    }
    isOpenResultModal.value = true
    return
  }

  const txId = await broadcastBTCTx(rawTx.value).catch((err: Error) => {
    isShowComfirm.value = false
    transactionResult.value = {
      status: 'failed',
      message: err.message,
    }
    isOpenResultModal.value = true
    throw err
  })
  if (!txId) {
    transactionResult.value = {
      status: 'failed',
      message: 'Send failed',
    }
    return
  }

  transactionResult.value = {
    chain: 'btc',
    status: 'success',
    txId: txId,
    fromAddress: address.value,
    toAdddress: recipient.value,
    amount: amount.value,
    token: {
      symbol,
      decimal: 8,
    },
  }

  isOpenResultModal.value = true

  // 刷新query
  queryClient.invalidateQueries({
    queryKey: ['balance', { address: address.value, symbol }],
  })
}

operationLock.value = false
</script>

<template>
  <div class="h-full">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />

    <!-- send page -->
    <div v-show="!isShowComfirm" class="space-y-4 w-full min-h-full pb-4 flex flex-col">
      <div class="grow space-y-4">
        <div class="flex items-center gap-3 rounded-md">
          <div class="grid grid-cols-3 gap-3 w-full">
            <div
              :class="[
                'flex items-center justify-center rounded-md relative aspect-square w-full overflow-hidden',
                { 'bg-blue-primary p-2': !imgUrl, 'border border-gray-soft rounded-xl': imgUrl },
              ]"
            >
              <img alt="" :src="imgUrl" v-if="imgUrl" class="w-full h-full" />
              <div class="text-xs overflow-hidden line-clamp-6 break-all text-white" :title="content" v-else>
                {{ content }}
              </div>
              <span
                :class="[
                  'absolute rounded right-0 bottom-1 py-3px px-1.5 text-xs scale-75',
                  imgUrl ? 'bg-[#EBECFF] text-[#787FFF]' : 'bg-[rgb(235,236,255,0.2) text-[#EBECFF]',
                ]"
              >
                {{ satoshis }} sat
              </span>
            </div>
          </div>
        </div>
        <Divider />

        <div class="space-y-2">
          <div class="texg-sm font-medium">Receive Address</div>
          <textarea
            v-model="recipient"
            placeholder="Recipient's address"
            class="border border-blue-primary w-full rounded-lg p-2 text-sm h-16 focus:outline-none focus:ring-0"
          />
        </div>
        <FeeRateSelector v-model:currentRateFee="currentRateFee" />
      </div>

      <div v-if="operationLock" class="w-full py-3 text-center text-sm text-gray-500">Loading...</div>
      <button
        v-else
        @click="next"
        :disabled="!recipient"
        :class="!recipient ? 'opacity-50 cursor-not-allowed' : ''"
        class="w-61.5 rounded-3xl py-3 bg-blue-primary text-center text-base text-white disabled:opacity-50 mx-auto"
      >
        Next
      </button>
    </div>

    <!-- comfirm page -->
    <div v-show="isShowComfirm" class="min-h-full flex flex-col">
      <div class="grow space-y-[30px]">
        <div class="grid grid-cols-3 gap-3">
          <div
            :class="[
              'flex items-center justify-center rounded-md relative aspect-square w-full overflow-hidden',
              { 'bg-blue-primary p-2': !imgUrl, 'border border-gray-soft rounded-xl': imgUrl },
            ]"
          >
            <img alt="" :src="imgUrl" v-if="imgUrl" class="w-full h-full" />
            <div class="text-xs overflow-hidden line-clamp-6 break-all text-white" :title="content" v-else>
              {{ content }}
            </div>
            <span
              class="absolute rounded right-0 bottom-1 py-3px px-1.5 bg-[rgb(235,236,255,0.2)] text-[#EBECFF] text-xs scale-75"
            >
              {{ satoshis }} sat
            </span>
          </div>
        </div>
        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <span>From</span>
            <span class="flex items-center gap-x-2">
              <span :title="address">{{ shortestAddress(address) }}</span>
              <Copy :text="address" />
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span>To</span>
            <span class="flex items-center gap-x-2">
              <span :title="recipient">{{ shortestAddress(recipient) }}</span>
              <Copy :text="recipient" />
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span>Network Fee</span>
            <span>{{ prettifyBalanceFixed(calcFee || 0, 'BTC', 8) }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-center gap-x-2">
        <button @click="cancel" class="w-30 rounded-3xl bg-blue-light py-4 text-ss text-blue-primary">Cancel</button>
        <button @click="send" class="w-30 rounded-3xl bg-blue-primary py-4 text-ss text-white">Confirm</button>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped></style>
