<script setup lang="ts">
import { ref, watch } from 'vue'
import { Avatar } from '@/components'
import { prettifyAddress } from '@/lib/formatters'
import { Chain } from '@metalet/utxo-wallet-service'
import { UTXO, getAllBtcUtxos } from '@/queries/utxos'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { addSafeUtxo, getSafeUtxos } from '@/lib/utxo'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const utxos = ref<UTXO[]>([])
const safeUtxos = ref<UTXO[]>([])
const isLoading = ref(true)
const feeRate = ref<number>()

const { getAddress } = useChainWalletsStore()

const address = getAddress(Chain.BTC)

watch(
  address,
  (newAddress) => {
    if (newAddress) {
      getAllBtcUtxos(newAddress).then((_utxos) => {
        utxos.value = _utxos
        isLoading.value = false
      })
      getSafeUtxos(newAddress, utxos.value).then((_safeUtxos) => {
        safeUtxos.value = _safeUtxos
      })
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="min-h-full flex flex-col">
    <div class="text-2xl font-medium">BTC Safe Mark</div>
    <div class="mt-2 text-gray-primary text-xs">Mark Safe UTXO to avoid failed transaction.</div>
    <div class="space-y-4 grow mt-4 overflow-y-auto">
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

      <div v-for="utxo in utxos" :key="utxo.txId" class="flex items-center justify-between w-full">
        <div
          class="space-y-2"
          @click="
            async () => {
              await addSafeUtxo(address, `${utxo.txId}:${utxo.outputIndex}`)
              safeUtxos.push(utxo)
            }
          "
        >
          <div class="label">{{ prettifyAddress(utxo.txId) }}:{{ utxo.outputIndex }}</div>
          <div class="value space-x-2">
            <span>value: {{ utxo.satoshis }}</span>
            <span>confirmed: {{ utxo.confirmed }}</span>
          </div>
        </div>
        <button
          class="text-xs hover:underline hover:text-blue-primary"
          v-if="
            safeUtxos.findIndex((utxo) => utxo.txId === utxo.txId && utxo.outputIndex === utxo.outputIndex) === -1 &&
            utxo.confirmed === false
          "
        >
          Add Safe
        </button>
      </div>
    </div>
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
