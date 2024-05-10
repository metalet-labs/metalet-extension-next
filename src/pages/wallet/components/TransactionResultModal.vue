<script lang="ts" setup>
import { PropType } from 'vue'
import { toTx } from '@/lib/helpers'
import { useRouter } from 'vue-router'
import Copy from '@/components/Copy.vue'
import { type Chain } from '@/lib/types'
import Modal from '@/components/Modal.vue'
import { getBrowserHost } from '@/lib/host'
import SuccessIcon from '@/assets/icons/success.svg?url'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { prettifyTokenBalance, prettifyAddress, prettifyTxId } from '@/lib/formatters'

const router = useRouter()

type SuccessResult = {
  chain: Chain
  status: 'success'
  txId: string
  fromAddress: string
  toAdddress: string
  amount: number
  confirmText?: string
  token: {
    symbol: string
    decimal: number
  }
}
type SuccessTxsResult = {
  chain: Chain
  status: 'successTxs'
  txIds: string[]
  confirmText?: string
}
type FailedResult = {
  status: 'failed'
  message: string
  router?: string
  confirmText?: string
}
type WarningResult = {
  status: 'warning'
  message: string
  confirmText?: string
}
export type TransactionResult = SuccessTxsResult | SuccessResult | FailedResult | WarningResult
const props = defineProps({
  isOpenResult: {
    type: Boolean,
    required: true,
  },
  result: {
    type: Object as PropType<undefined | TransactionResult>,
  },
})
const emit = defineEmits(['update:isOpenResult'])

function closeModal() {
  emit('update:isOpenResult', false)
}

function ok() {
  closeModal()
  if (props.result?.status === 'success') {
    router.replace('/')
  }
}

const toResultTx = async () => {
  if (!props.result || props.result.status !== 'success') return

  const host = await getBrowserHost(props.result.chain)

  toTx(props.result.txId, host as string)
}

const toResultTxs = async (txId: string) => {
  if (!props.result || props.result.status !== 'successTxs') return

  const host = await getBrowserHost(props.result.chain)

  toTx(txId, host as string)
}
</script>

<template>
  <Modal :is-open="props.isOpenResult" @update:is-open="$emit('update:isOpenResult', $event)">
    <template #title v-if="result && result.status === 'failed'">
      <div class="text-center">
        <span class="text-gray-500 text-lg font-bold">Transaction Failed</span>
      </div>
    </template>
    <template #title v-if="result && result.status === 'warning'">
      <div class="flex items-center gap-2">
        <span class="text-gray-500">Transaction Warning</span>
        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-500"></ExclamationTriangleIcon>
      </div>
    </template>
    <template #title v-if="result && (result.status === 'success' || result.status === 'successTxs')">
      <div class="flex flex-col justify-center items-center gap-[18px]">
        <img class="w-[54px] h-[54px]" :src="SuccessIcon" alt="" />
        <span class="text-black-primary">Sent Successfully</span>
      </div>
    </template>

    <template #body>
      <div class="mt-4 space-y-4" v-if="result && (result.status === 'failed' || result.status === 'warning')">
        <div class="space-y-1">
          <div class="text-sm text-gray-500 break-all text-center">{{ result.message }}</div>
        </div>
      </div>

      <div class="mt-[37px] space-y-4" v-if="result && result.status === 'success'">
        <div class="flex justify-between">
          <div class="label">Amount</div>
          <div class="text-sm">
            {{ `${prettifyTokenBalance(result.amount, result.token.decimal)} ${result.token.symbol}` }}
          </div>
        </div>

        <div class="flex justify-between">
          <div class="label">From</div>
          <div class="text-xs flex items-center gap-2">
            <div class="hover:underline hover:text-blue-primary cursor-pointer" :title="result.fromAddress">
              {{ prettifyAddress(result.fromAddress) }}
            </div>
            <Copy :text="result.fromAddress" />
          </div>
        </div>

        <div class="flex justify-between">
          <div class="label">To</div>
          <div class="text-xs flex items-center gap-2">
            <div class="hover:underline hover:text-blue-primary cursor-pointer" :title="result.toAdddress">
              {{ prettifyAddress(result.toAdddress) }}
            </div>
            <Copy :text="result.toAdddress" />
          </div>
        </div>

        <div class="flex justify-between">
          <div class="label">TxID</div>
          <div class="text-xs flex items-center gap-2">
            <div
              class="hover:underline hover:text-blue-primary cursor-pointer"
              @click="toResultTx"
              :title="result.txId"
            >
              {{ prettifyTxId(result.txId) }}
            </div>
            <Copy :text="result.txId" />
          </div>
        </div>
      </div>

      <div class="mt-[37px] space-y-4" v-if="result && result.status === 'successTxs'">
        <div class="flex justify-between" v-for="(txId, index) in result.txIds" :key="index">
          <div class="label">TxID{{ index + 1 }}</div>
          <div class="text-xs flex gap-2">
            <div class="hover:underline truncate w-48 cursor-pointer" @click="toResultTxs(txId)" :title="txId">
              {{ txId }}
            </div>
            <Copy :text="txId" />
          </div>
        </div>
      </div>
    </template>

    <template #control>
      <div class="flex items-center justify-center gap-2" v-if="result && result.status === 'failed' && result.router">
        <button @click="closeModal" class="w-30 rounded-3xl py-4 text-ss text-blue-primary bg-blue-light">
          Cancel
        </button>
        <button
          class="bg-blue-primary rounded-3xl py-4 text-ss w-30 text-white px-4"
          @click="$router.push({ name: (result as FailedResult).router })"
        >
          {{ result?.confirmText || 'Confirm' }}
        </button>
      </div>
      <div v-else class="flex justify-center">
        <button class="w-61.5 rounded-3xl bg-blue-primary py-3 text-sm text-white outline-none" @click="ok">
          {{ result?.confirmText || 'Confirm' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
