<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BRCToken from './Inscription.vue'
import NO_NFT_DATA from './NoNFTData.vue'
import { LoadingText } from '@/components'
import { formatTimestamp } from '@/lib/formatters'
import { Chain } from '@metalet/utxo-wallet-service'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useInscriptionsInfiniteQuery } from '@/queries/inscribe'

const size = ref(10)
const router = useRouter()

const { getAddress } = useChainWalletsStore()

const address = getAddress(Chain.BTC)

const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInscriptionsInfiniteQuery(
  address,
  size,
  {
    enabled: computed(() => !!address.value),
  }
)

const inscriptions = computed(() => (data.value ? data.value.pages.flatMap((page) => page.list) : []))

const toBRC20Detail = (inscriptionId: string) => {
  router.push({
    name: 'brc20Detail',
    params: {
      address: address.value,
      inscriptionId,
    },
  })
}
</script>

<template>
  <div class="space-y-4">
    <LoadingText v-if="isLoading" text="InscriptionList loading..." />
    <div v-else-if="inscriptions.length">
      <div class="px-3 py-4 grid grid-cols-3 gap-x-3 gap-y-7">
        <div
          v-for="inscription in inscriptions"
          @click="toBRC20Detail(inscription.inscriptionId)"
          class="flex flex-col items-center justify-center rounded-md cursor-pointer text-gray-primary"
        >
          <BRCToken :value="inscription.outputValue" :contentBody="inscription.contentBody" />
          <span class="text-sm text-center mt-3 truncate" :title="'# ' + inscription.inscriptionNumber">
            {{ inscription.utxoHeight === 0 ? 'Uncomfirmed' : `# ${inscription.inscriptionNumber}` }}
          </span>
          <span class="text-xs text-center mt-1 h-[30px]">{{ formatTimestamp(inscription.timestamp) }}</span>
        </div>
      </div>
      <div
        v-if="hasNextPage"
        :disabled="isFetchingNextPage"
        @click="() => fetchNextPage()"
        :class="[
          'text-gray-primary flex items-center gap-2 justify-center',
          !isFetchingNextPage ? 'cursor-pointer hover:text-blue-500 hover:underline' : 'cursor-not-allowed',
        ]"
      >
        <span>Load more Ordinals</span>
        <LoadingIcon v-if="isFetchingNextPage" class="!text-gray-primary" />
      </div>
    </div>
    <NO_NFT_DATA v-else />
  </div>
</template>

<style lang="less" scoped></style>
