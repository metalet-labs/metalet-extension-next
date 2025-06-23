<script setup lang="ts">
import { computed, ref } from 'vue'
import { FEEB } from '@/data/config'
import { Avatar } from '@/components'
import { getNetwork } from '@/lib/network'
import { useMVCUtxosQuery } from '@/queries/utxos'
import { prettifyAddress } from '@/lib/formatters'
import { Chain } from '@metalet/utxo-wallet-service'
import { fetchSpaceBalance } from '@/queries/balance'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { API_NET, API_TARGET, Wallet } from 'meta-contract'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TransactionResultModal, { type TransactionResult } from '@/pages/wallet/components/TransactionResultModal.vue'
import { getDefaultMVCTRate } from '@/queries/transaction'

const isOpenResultModal = ref(false)
const transactionResult = ref<TransactionResult | undefined>()

const { getAddress, currentMVCWallet } = useChainWalletsStore()
const address = getAddress(Chain.MVC)

const merge = async () => {
  const network: API_NET = (await getNetwork()) as API_NET
  const purse = currentMVCWallet.value!.getPrivateKey()
  const feeb = await getDefaultMVCTRate()
  const wallet = new Wallet(purse, network, feeb, API_TARGET.APIMVC)
  let { txId } = await wallet.merge().catch((err) => {
    isOpenResultModal.value = true
    transactionResult.value = {
      status: 'warning',
      message: err.message,
    }
    throw err
  })
  isOpenResultModal.value = true
  const balance = await fetchSpaceBalance(address.value)
  transactionResult.value = {
    chain: 'mvc',
    status: 'success',
    txId,
    fromAddress: address.value,
    toAddress: address.value,
    amount: balance.total.toNumber(),
    token: {
      symbol: 'SPACE',
      decimal: 8,
    },
  }
}

const { isLoading, data } = useMVCUtxosQuery(address, { enabled: computed(() => !!address.value) })
</script>

<template>
  <div class="min-h-full flex flex-col">
    <div class="text-2xl font-medium">Space Merge</div>
    <div class="mt-2 text-gray-primary text-xs">
      Due to the technical characteristics of UTXO, when there are too many UTXOs for a certain token, problems such as
      transaction failure loops may occur. The merging tool will automatically assist you in consolidating scattered
      UTXOs into one.
    </div>
    <div class="space-y-4 grow mt-4">
      <div class="flex gap-3 items-center">
        <Avatar :id="address" />
        <div class="flex flex-col gap-1">
          <div class="text-sm font-medium">MVC(Bitcoin sidechain) Address</div>
          <div class="text-gray-primary text-xs" :title="address">{{ prettifyAddress(address) }}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="label">UTXO Count:</div>
        <LoadingIcon v-if="isLoading" />
        <div class="value" v-else>{{ data?.length }}</div>
      </div>

      <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />
    </div>
    <button
      @click="merge"
      :disabled="!data || data.length < 3"
      :class="[
        'bg-blue-primary text-white w-61.5 rounded-3xl my-12 py-4 text-xs mx-auto',
        { 'cursor-not-allowed opacity-50': !data || data.length < 3 },
      ]"
    >
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
