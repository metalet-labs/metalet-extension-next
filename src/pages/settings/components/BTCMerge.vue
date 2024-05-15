<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BtcWallet } from '@/lib/wallets/btc'
import { getBtcUtxos } from '@/queries/utxos'
import { prettifyAddress } from '@/lib/formatters'
import { fetchBtcBalance } from '@/queries/balance'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { FeeRateSelector, Avatar } from '@/components'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TransactionResultModal, { type TransactionResult } from '@/pages/wallet/components/TransactionResultModal.vue'

const utxos = ref()
const isLoading = ref(true)
const feeRate = ref<number>()
const operationLock = ref(false)
const isOpenResultModal = ref(false)
const transactionResult = ref<TransactionResult | undefined>()

const { getAddress, currentBTCWallet } = useChainWalletsStore()

const address = getAddress(Chain.BTC)

watch(
  address,
  (newAddress) => {
    if (newAddress) {
      const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH
      getBtcUtxos(newAddress, needRawTx).then((_utxos) => {
        utxos.value = _utxos
        isLoading.value = false
      })
    }
  },
  { immediate: true }
)

const mergeDisabled = computed(() => {
  return !utxos.value || utxos.value.length < 5 || !feeRate.value || operationLock.value
})

const merge = async () => {
  if (feeRate.value) {
    operationLock.value = true
    const wallet = await BtcWallet.create()
    const { txId } = await wallet.merge(feeRate.value)
    const balance = await fetchBtcBalance(address.value)
    operationLock.value = false
    isOpenResultModal.value = true
    transactionResult.value = {
      chain: 'btc',
      status: 'success',
      txId,
      fromAddress: address.value,
      toAdddress: address.value,
      amount: balance.total,
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
</script>

<template>
  <div class="min-h-full flex flex-col">
    <div class="text-2xl font-medium">BTC Merge</div>
    <div class="mt-2 text-gray-primary text-xs">
      Due to the technical characteristics of UTXO, when there are too many UTXOs of a certain token, problems such as
      cycle failure will occur. The merge tool will automatically help you merge scattered UTXOs into one.
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

      <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />
    </div>
    <button
      @click="merge"
      :disabled="mergeDisabled"
      :class="[
        { 'cursor-not-allowed opacity-50': mergeDisabled },
        'bg-blue-primary text-white text-xs w-61.5 rounded-3xl my-12 py-4 mx-auto flex items-center justify-center gap-x-2',
      ]"
    >
      <ArrowPathIcon class="animate-spin w-4 h-4" v-if="operationLock" />
      Merge
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

{"ab61352c3fea9f802dd0465e0bdc28d4":{"id":"ab61352c3fea9f802dd0465e0bdc28d4","name":"Wallet 01","mnemonic":"attend
cattle blanket flower before nose scare sweet someone spider kiss
boil","mvcTypes":[10001,236],"accounts":[{"id":"961f962c63a1942e8900e892090a27ae","name":"Account
01","addressIndex":0},{"id":"6d3573ec75b1ca1228ddaccba8d975a7","name":"Account
02","addressIndex":1},{"id":"7fc414c0c39befd62cce714fca57f326","name":"Account
03","addressIndex":2}]},"40bbaca19806d54f4aed0643b612ef34":{"id":"40bbaca19806d54f4aed0643b612ef34","name":"Wallet
02","mnemonic":"tumble deposit bird brush sponsor limit play destroy truly hat lazy
icon","mvcTypes":[10001],"accounts":[{"id":"455c1bc18ba14e23593c51d7d75ae103","name":"Account 01","addressIndex":0}]}}
