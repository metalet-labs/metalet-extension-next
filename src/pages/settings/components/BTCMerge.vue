<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getBtcUtxos, useBTCUtxosQuery } from '@/queries/utxos'
import { prettifyAddress, prettifyTxId } from '@/lib/formatters'
import { useBTCBalanceQuery } from '@/queries/balance'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { FeeRateSelector, Avatar } from '@/components'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { Chain, ScriptType, SignType } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TransactionResultModal, { type TransactionResult } from '@/pages/wallet/components/TransactionResultModal.vue'
import { merge, split } from '@/lib/wallets/btc'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Decimal from 'decimal.js'
import { broadcastBTCTx } from '@/queries/transaction'
import { sleep } from '@/lib/helpers'
import Copy from '@/components/Copy.vue'

const mergeNum = ref('50')
const feeRate = ref<number>()
const operationLock = ref(false)
const isOpenResultModal = ref(false)
const transactionResult = ref<TransactionResult | undefined>()

const { getAddress, currentBTCWallet } = useChainWalletsStore()

const address = getAddress(Chain.BTC)
const transactions = ref<
  {
    fee: number
    txId: string
    rawTx: string
    total: Decimal
  }[]
>([])

const { data: balance } = useBTCBalanceQuery(address, {
  useUnconfirmed: false,
  enabled: computed(() => !!currentBTCWallet.value && !!address.value),
  needRawTx: currentBTCWallet.value?.getScriptType() === ScriptType.P2PKH,
})
const { data: utxos, isLoading } = useBTCUtxosQuery(address, {
  useUnconfirmed: false,
  enabled: computed(() => !!currentBTCWallet.value && !!address.value),
  needRawTx: currentBTCWallet.value?.getScriptType() === ScriptType.P2PKH,
})

const mergeDisabled = computed(() => {
  return !utxos.value || utxos.value.length < 5 || !feeRate.value || operationLock.value
})

const mergeFn = async () => {
  if (feeRate.value && utxos.value) {
    operationLock.value = true
    await sleep(1000)
    const promises = []
    for (let i = 0; i < utxos.value.length; i += Number(mergeNum.value)) {
      const splitUtxos = utxos.value.slice(i, Math.min(i + Number(mergeNum.value), utxos.value.length))
      const p = merge(feeRate.value, splitUtxos).then((transaction) => {
        transactions.value.push(transaction)
      })
      promises.push(p)
    }
    await Promise.all(promises)
    operationLock.value = false
  } else {
    isOpenResultModal.value = true
    transactionResult.value = {
      status: 'warning',
      message: 'Please select fee rate',
    }
  }
}

const splitFn = async () => {
  if (feeRate.value && utxos.value) {
    operationLock.value = true
    await sleep(1000)
    const { txId } = await split(feeRate.value, utxos.value)
    operationLock.value = false
    isOpenResultModal.value = true
    transactionResult.value = {
      chain: 'btc',
      status: 'success',
      txId,
      fromAddress: address.value,
      toAddress: address.value,
      amount: balance.value!.total.toNumber(),
      token: {
        symbol: 'BTC',
        decimal: 8,
      },
    }
  } else {
    isOpenResultModal.value = true
    transactionResult.value = {
      status: 'warning',
      message: 'Please select fee rate',
    }
  }
}

const broadcast = () => {
  sleep(1000)
  Promise.all(transactions.value.map((tx) => broadcastBTCTx(tx.rawTx))).then((txIds: string[]) => {
    operationLock.value = false
    isOpenResultModal.value = true
    transactionResult.value = {
      chain: 'btc',
      status: 'success',
      txId: txIds[0],
      fromAddress: address.value,
      toAddress: address.value,
      amount: balance.value!.total.toNumber(),
      token: {
        symbol: 'BTC',
        decimal: 8,
      },
    }
  })
}
</script>

<template>
  <div class="min-h-full flex flex-col">
    <div class="text-2xl font-medium">BTC Merge</div>
    <div class="mt-2 text-gray-primary text-xs">
      Due to the technical nature of UTXO, when there are too many UTXOs for a specific token, problems such as
      transaction failure loops may occur. The merging tool will automatically assist you in consolidating scattered
      UTXOs into one.
    </div>
    <div class="space-y-4 grow mt-4">
      <div class="flex gap-3 items-center">
        <Avatar :id="address" />
        <div class="flex flex-col gap-1">
          <div class="text-sm font-medium">BTC Address</div>
          <div class="text-gray-primary text-xs" :title="address">{{ prettifyAddress(address) }}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="label">UTXO Count</div>
        <LoadingIcon v-if="isLoading" />
        <div class="value" v-else>{{ utxos?.length }}</div>
      </div>

      <FeeRateSelector v-model:currentRateFee="feeRate" />

      <div class="flex items-center gap-2">
        <div class="label">Merge Num</div>
        <Select v-model="mergeNum">
          <SelectTrigger class="">
            <SelectValue placeholder="50" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="150">150</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="300">300</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="h-80 overflow-y-auto nicer-scrollbar -mr-4 pr-4 w-full overflow-x-hidden" v-if="transactions.length">
        <table class="w-full table-fixed">
          <thead>
            <tr>
              <th class="text-xs w-6"></th>
              <th class="text-xs w-28">TxID</th>
              <th class="text-xs">{{ $t('Common.Total') }}</th>
              <th class="text-xs">Total Input</th>
              <th class="text-xs">Total Output</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(transaction, index) in transactions" :key="transaction.txId">
              <td class="border text-xs text-center p-1">{{ index + 1 }}</td>
              <td class="border text-xs p-1">
                <div class="flex items-center justify-center gap-2">
                  {{ prettifyTxId(transaction.txId, 4) }}
                  <Copy
                    :title="$t('CopiedText.RawTxCopiedText')"
                    :text="transaction.rawTx"
                    :show-content="false"
                    class="size-5"
                  />
                </div>
              </td>
              <td class="border text-xs p-1">{{ new Decimal(transaction.fee).div(1e8).toFixed() }} BTC</td>
              <td class="border text-xs p-1">{{ transaction.total.div(1e8).toFixed() }} BTC</td>
              <td class="border text-xs p-1">{{ transaction.total.minus(transaction.fee).div(1e8).toFixed() }} BTC</td>
            </tr>
          </tbody>
        </table>
      </div>

      <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />
    </div>
    <!-- <button
      @click="splitFn"
      :class="[
        { 'cursor-not-allowed opacity-50': mergeDisabled },
        'bg-blue-primary text-white text-xs w-61.5 rounded-3xl my-12 py-4 mx-auto flex items-center justify-center gap-x-2',
      ]"
    >
      <ArrowPathIcon class="animate-spin w-4 h-4" v-if="operationLock" />
      Split
    </button> -->

    <button
      @click="mergeFn"
      v-if="!transactions.length"
      :disabled="mergeDisabled"
      :class="[
        { 'cursor-not-allowed opacity-50': mergeDisabled },
        'bg-blue-primary text-white text-xs w-61.5 rounded-3xl my-12 py-4 mx-auto flex items-center justify-center gap-x-2',
      ]"
    >
      <ArrowPathIcon class="animate-spin w-4 h-4" v-if="operationLock" />
      Merge
    </button>
    <button
      v-else
      @click="broadcast"
      :disabled="!transactions.length"
      :class="[
        { 'cursor-not-allowed opacity-50': mergeDisabled },
        'bg-blue-primary text-white text-xs w-61.5 rounded-3xl my-12 py-4 mx-auto flex items-center justify-center gap-x-2',
      ]"
    >
      <ArrowPathIcon class="animate-spin w-4 h-4" v-if="operationLock" />
      Broadcast
    </button>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}

.value {
  @apply text-sm text-gray-700;
}
</style>
