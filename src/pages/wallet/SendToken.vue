<script lang="ts" setup>
import Decimal from 'decimal.js'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { API_NET, FtManager } from 'meta-contract'
import { CircleStackIcon } from '@heroicons/vue/24/solid'
import { useQueryClient } from '@tanstack/vue-query'

import { getNetwork } from '@/lib/network'
import { prettifyTokenBalance } from '@/lib/formatters'
import { getAddress, getCurrentAccount, getPrivateKey } from '@/lib/account'
import type { TransactionResult } from '@/global-types'
import { useMVCTokenQuery } from '@/queries/tokens'

import Modal from '@/components/Modal.vue'
import TransactionResultModal from './components/TransactionResultModal.vue'

const route = useRoute()
const symbol = ref(route.params.symbol as string)
const genesis = ref(route.params.genesis as string)
const address = ref(route.params.address as string)

const queryClient = useQueryClient()

const error = ref<Error>()

// 用户拥有的代币资产
const { isLoading, data: asset } = useMVCTokenQuery(address, genesis, {
  enabled: computed(() => !!address.value && !genesis.value),
})

// form
const amount = ref('')
const amountInSats = computed(() => {
  const _amount = Number(amount.value)
  if (Number.isNaN(amount)) return 0
  return _amount * 10 ** asset.value!.decimal
})
const recipient = ref('')

const isOpenConfirmModal = ref(false)
const popConfirm = () => {
  isOpenConfirmModal.value = true
}
const isOpenResultModal = ref(false)
const transactionResult = ref<TransactionResult>()

const operationLock = ref(false)
async function send() {
  if (operationLock.value) return

  operationLock.value = true

  const privateKey = await getPrivateKey('mvc')

  const network = await getNetwork()

  const ftManager = new FtManager({
    network: network as API_NET,
    purse: privateKey,
  })

  // Pick the largest utxo from wallet to pay the transaction
  const largestUtxo = await ftManager.api
    .getUnspents(address.value)
    .then((utxos) => {
      return utxos.reduce((prev, curr) => {
        if (curr.satoshis > prev.satoshis) return curr
        return prev
      })
    })
    .then((utxo) => {
      // add wif to utxo
      return {
        ...utxo,
        wif: privateKey,
      }
    })

  const transferRes = await ftManager
    .transfer({
      codehash: asset.value?.codeHash!,
      genesis: asset.value?.genesis!,
      senderWif: privateKey,
      receivers: [
        {
          address: recipient.value,
          amount: amountInSats.value.toString(),
        },
      ],
      utxos: [largestUtxo],
    })
    .catch((err) => {
      isOpenConfirmModal.value = false
      error.value = err.message
      if (err instanceof Error) {
        if (err.message === 'Too many token-utxos, should merge them to continue.') {
          transactionResult.value = {
            router: 'ft-merge',
            status: 'failed',
            message: err.message,
            confirmText: 'Merge',
          }
        }
      } else {
        transactionResult.value = {
          status: 'failed',
          message: err.message,
        }
      }

      isOpenResultModal.value = true
    })
  if (transferRes && transferRes.txid) {
    isOpenConfirmModal.value = false
    transactionResult.value = {
      chain: 'mvc',
      status: 'success',
      txId: transferRes.txid,
      fromAddress: address.value,
      toAdddress: recipient.value,
      amount: amountInSats.value,
      token: {
        symbol: asset.value!.symbol,
        decimal: asset.value!.decimal,
      },
    }

    isOpenResultModal.value = true

    // 刷新query
    queryClient.invalidateQueries({
      queryKey: ['tokens', { address: address.value }],
    })
  }

  operationLock.value = false
}
</script>

<template>
  <div class="mt-8 flex flex-col items-center gap-y-8" v-if="asset && genesis">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />
    <img :src="asset?.logo" alt="" class="h-16 w-16 rounded-xl" v-if="asset?.logo" />
    <CircleStackIcon class="h-10 w-10 text-gray-300 transition-all group-hover:text-blue-500" v-else />

    <div class="space-y-3 self-stretch">
      <!-- address input -->
      <input class="main-input w-full !rounded-xl !p-4 text-sm" placeholder="Recipient's address" v-model="recipient" />

      <!-- amount input -->
      <div class="relative">
        <input class="main-input w-full !rounded-xl !py-4 !pl-4 !pr-12 text-sm" placeholder="Amount" v-model="amount" />
        <!-- unit -->
        <div
          class="absolute right-0 top-0 flex h-full items-center justify-center text-right text-xs text-gray-500"
          v-if="asset?.symbol"
        >
          <div class="border-l border-solid border-gray-500 px-4 py-1">{{ asset.symbol }}</div>
        </div>
      </div>

      <!-- balance -->
      <div class="flex items-center gap-x-2 text-xs text-gray-500">
        <div>Your Balance:</div>
        <div v-if="isLoading">--</div>
        <div v-else-if="asset">
          {{ prettifyTokenBalance(asset.balance?.total || 0, asset.decimal) + ' ' + asset.symbol }}
        </div>
      </div>
    </div>

    <!-- send -->
    <button class="main-btn-bg w-full rounded-lg py-3 text-sm text-sky-100" @click="popConfirm">Send</button>

    <Modal v-model:is-open="isOpenConfirmModal" title="Confirm">
      <template #title>
        <div class="text-black-primary text-center">Confirm Send</div>
      </template>

      <template #body>
        <div class="mt-4 space-y-4">
          <div class="space-y-1">
            <div class="label">Amount</div>
            <div class="value">{{ amount }} {{ asset?.symbol }}</div>
          </div>
          <div class="space-y-1">
            <div class="label">Recipient Address</div>
            <div class="value break-all text-sm">{{ recipient }}</div>
          </div>
          <!-- <div class="space-y-1">
            <div class="label">Network Fee</div>
            <div class="value">100 SPACE</div>
          </div> -->
        </div>
      </template>

      <template #control>
        <div v-if="operationLock">
          <div class="w-full py-3 text-center text-sm text-gray-500">Operating...</div>
        </div>
        <div class="grid grid-cols-2 gap-x-4" v-else>
          <button
            class="w-full rounded-lg border border-primary-blue bg-white py-3 text-sm text-gray-700"
            @click="isOpenConfirmModal = false"
          >
            Cancel
          </button>
          <button class="main-btn-bg w-full rounded-lg py-3 text-sm text-sky-100" @click="send">Confirm</button>
        </div>
      </template>
    </Modal>
  </div>
  <div v-else class="text-center text-gray-primary w-full py-3 text-base">Token can not found.</div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
