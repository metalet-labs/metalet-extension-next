<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, computed, watch } from 'vue'
import { LoadingText } from '@/components'
import { Chain } from '@metalet/utxo-wallet-service'
import MetaContractItem from './MetaContractItem.vue'
import { useMetacontractsQuery } from '@/queries/nfts'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

// TODO: refresh
const flag = ref('')
const cursorRef = ref(0)
const router = useRouter()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.MVC)

const { isLoading, data: metaContracts } = useMetacontractsQuery(
  { address },
  { enabled: computed(() => !!address.value) }
)

const loadBRCInscriptions = () => {
  cursorRef.value = cursorRef.value + 1
}

const toNftDetail = (metaContract: {
  codehash: string
  genesis: string
  tokenIndex: number
  metaTxId: string
  metaOutputIndex: number
}) => {
  router.push(
    `/nfts/${metaContract.codehash}/${metaContract.genesis}/${metaContract.tokenIndex}?meta_txid=${metaContract.metaTxId}&meta_output_index=${metaContract.metaOutputIndex}`
  )
}
</script>

<template>
  <LoadingText v-if="isLoading" text="Metacontracts loading..." />
  <div v-else-if="metaContracts?.length">
    <div class="py-4 grid grid-cols-3 gap-x-3 gap-y-7">
      <MetaContractItem
        :key="metaContractItem.id"
        :metaContractItem="metaContractItem"
        @click="toNftDetail(metaContractItem)"
        v-for="metaContractItem in metaContracts"
      />
    </div>
    <div
      v-if="false"
      @click="loadBRCInscriptions"
      class="text-center text-gray-primary hover:underline cursor-pointer hover:text-blue-500"
    >
      Load more MetaContracts
    </div>
  </div>
  <div v-else class="w-full py-24 text-center text-sm font-bold text-gray-500">No Metacontracts yet.</div>
</template>

<style lang="less" scoped></style>
