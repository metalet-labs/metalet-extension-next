<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import useNftsQuery from '@/queries/nfts'
import NftItem from './components/NftItem.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import { useCollectionInfoQuery } from '@/queries/metadata'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.MVC)

const route = useRoute()
const { codehash, genesis } = route.params as {
  codehash: string
  genesis: string
}
const { meta_txid: txid, meta_output_index: outputIndex } = route.query as {
  meta_txid: string
  meta_output_index: string
}
const { data: collectionInfo } = useCollectionInfoQuery(txid, Number(outputIndex))

const { data: nfts } = useNftsQuery(
  address,
  {
    codehash,
    genesis,
    limit: 10,
  },
  {
    enabled: computed(() => !!address.value),
  }
)
</script>

<template>
  <!-- Info -->
  <div class="my-4 border-b border-gray-100 pb-4 text-sm" v-if="collectionInfo">
    <h3 class="gradient-text text-xl">{{ collectionInfo.name }}</h3>
    <div class="text-gray-500">Total Supply: {{ collectionInfo.totalSupply }}</div>
    <div class="mt-4 text-xs">{{ collectionInfo.description }}</div>
  </div>

  <!-- list -->
  <div class="grid grid-cols-3 gap-x-2">
    <NftItem
      v-for="nft in nfts"
      :nft="nft"
      :collection-meta-info="{
        metaTxid: txid,
        metaOutputIndex: Number(outputIndex),
      }"
    />
  </div>
</template>
