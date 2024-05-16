<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BtcIcon from '@/assets/icons-v3/network_btc.svg'
import { useBRCInscriptionInfoQuery } from '@/queries/inscribe'
import { formatTimestamp, shortestAddress, prettifyTxId, prettifyTokenGenesis } from '@/lib/formatters'
import { LoadingText } from '@/components'

const router = useRouter()
const { params } = useRoute()

const address = params.address as string
const inscriptionId = ref(params.inscriptionId as string)

const {
  isLoading,
  data: inscriptionDetail,
  error,
} = useBRCInscriptionInfoQuery(inscriptionId, {
  enabled: computed(() => !!inscriptionId.value),
})

watch(error, () => {
  if (error) {
    router.go(-1)
  }
})

const toSendNFT = (id: string) => {
  router.push({
    name: 'sendNFT',
    params: { id, nftType: 'brc20' },
    query: {
      amount: inscriptionDetail.value?.outputValue,
      satoshis: inscriptionDetail.value?.outputValue,
      content: inscriptionDetail.value?.contentBody,
    },
  })
}
</script>

<template>
  <LoadingText text="Inscription Detail Loading..." v-if="isLoading" />
  <div class="w-full space-y-4" v-else-if="inscriptionDetail">
    <div class="w-full flex items-center justify-center">
      <div class="w-[220px] h-[220px] bg-blue-primary flex items-center justify-center rounded-xl relative p-2">
        <div class="text-white break-all">{{ inscriptionDetail.contentBody }}</div>
        <span class="absolute rounded right-3 bottom-3 py-3px px-1.5 bg-[rgb(235,236,255,0.2)] text-[#EBECFF] text-xs">
          {{ inscriptionDetail.outputValue }} sats
        </span>
      </div>
    </div>

    <div class="flex items-center justify-center text-lg">
      <span v-if="inscriptionDetail.inscriptionNumber !== -1"># {{ inscriptionDetail.inscriptionNumber }}</span>
      <span v-else>Uncomfirmed</span>
    </div>

    <div class="flex justify-center">
      <button
        @click="toSendNFT(inscriptionId)"
        class="w-30 rounded-3xl py-4 text-center text-ss text-blue-primary bg-blue-light mx-auto"
      >
        Transfer
      </button>
    </div>

    <div class="space-y-4 border-t border-gray-secondary pt-4">
      <div class="row">
        <div class="label">Network</div>
        <div class="flex items-center gap-1">
          <BtcIcon class="w-4.5" />
          <span class="text-sm">Bitcoin</span>
        </div>
      </div>
      <div class="row">
        <span class="label">ID</span>
        <div :title="inscriptionDetail.inscriptionId">
          {{ prettifyTxId(inscriptionDetail.inscriptionId) }}
        </div>
      </div>
      <div class="row">
        <span class="label">Address</span>
        <div :title="address">
          {{ shortestAddress(address) }}
        </div>
      </div>
      <div class="row">
        <span class="label">Output value:</span>
        <div>
          {{ inscriptionDetail.outputValue }}
        </div>
      </div>
      <div class="row">
        <span class="label">Preview</span>
        <a
          target="_blank"
          :href="inscriptionDetail.preview"
          :title="inscriptionDetail.preview"
          class="w-52 truncate text-[#5173B9] underline"
        >
          {{ inscriptionDetail.preview }}
        </a>
      </div>
      <div class="row">
        <span class="label">Content</span>
        <a
          target="_blank"
          :href="inscriptionDetail.content"
          :title="inscriptionDetail.content"
          class="w-52 truncate text-[#5173B9] underline"
        >
          {{ inscriptionDetail.content }}
        </a>
      </div>
      <div class="row">
        <span class="label">Content Length</span>
        <span>{{ inscriptionDetail.contentLength }}</span>
      </div>
      <div class="row">
        <span class="label">Content Type</span>
        <span>{{ inscriptionDetail.contentType }}</span>
      </div>
      <div class="row">
        <span class="label">Timestamp</span>
        <div>{{ formatTimestamp(inscriptionDetail.timestamp) }}</div>
      </div>
      <div class="row">
        <span class="label">Genesis Transaction</span>
        <div :title="inscriptionDetail.genesisTransaction">
          {{ prettifyTokenGenesis(inscriptionDetail.genesisTransaction) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.row {
  @apply flex items-center justify-between;
}

.title {
  font-size: 14px;
  color: #909399;
  font-weight: bold;
}
</style>
