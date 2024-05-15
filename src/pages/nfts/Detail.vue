<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { isOfficialNft } from '@/lib/nft'
import { LoadingText } from '@/components'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMetacontractsQuery } from '@/queries/nfts'
import MvcIcon from '@/assets/icons-v3/network_mvc.svg'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { prettifyTimestamp, prettifyTokenGenesis } from '@/lib/formatters'

const router = useRouter()
const props = defineProps<{
  codehash: string
  genesis: string
  tokenIndex: number
}>()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.MVC)
const codehash = computed(() => props.codehash)
const genesis = computed(() => props.genesis)
const tokenIndex = computed(() => props.tokenIndex)

const { isLoading, data: metaContracts } = useMetacontractsQuery(
  { address, codehash, genesis },
  { enabled: computed(() => !!address.value) }
)

const infoDetail = computed(() => {
  if (metaContracts.value?.length) {
    return metaContracts.value[0]
  }
})

const toTransferNft = () => {
  router.push(`/nfts/transfer-nft/${codehash.value}/${genesis.value}/${tokenIndex.value}`)
}
</script>

<template>
  <LoadingText v-if="isLoading" text="MetaContract Detail Loading..." />
  <div v-else-if="infoDetail" class="space-y-4">
    <div class="mx-auto aspect-square w-[220px] overflow-hidden rounded-lg">
      <img :src="infoDetail.imgUrl" class="h-full w-full object-contain" />
    </div>

    <div>
      <div class="flex items-center justify-center gap-2 text-xs text-blue-primary">
        {{ infoDetail.name }}
        <CheckBadgeIcon class="h-5 w-5 text-blue-primary" v-if="isOfficialNft(infoDetail.genesis)" />
      </div>

      <div class="flex items-center justify-center text-lg">
        {{ infoDetail.seriesName }} #{{ infoDetail.tokenIndex }}
      </div>
    </div>

    <div class="flex justify-center">
      <button
        @click="toTransferNft"
        class="w-30 rounded-3xl py-4 text-center text-ss text-blue-primary bg-blue-light mx-auto"
      >
        Transfer
      </button>
    </div>

    <div class="space-y-4 border-t border-gray-secondary pt-4">
      <div class="row">
        <div class="label">Network</div>
        <div class="flex items-center gap-1">
          <MvcIcon class="w-4.5" />
          <span class="text-sm">MicrovisionChain</span>
        </div>
      </div>

      <div class="row">
        <div class="label">Creator</div>
        <div class="value">{{ infoDetail.issuerAddress }}</div>
      </div>

      <div class="row">
        <div class="label">Create Time</div>
        <div class="value">{{ prettifyTimestamp(infoDetail.issueTime) }}</div>
      </div>

      <div class="row">
        <div class="label">Genesis ID</div>
        <div class="value">{{ prettifyTokenGenesis(genesis) }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.row {
  @apply flex items-center justify-between;
}
</style>
