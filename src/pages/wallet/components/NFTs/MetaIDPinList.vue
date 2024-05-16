<script setup lang="ts">
import { ref, computed } from 'vue'
import MetaPin from './MetaPin.vue'
import { useRouter } from 'vue-router'
import NO_NFT_DATA from './NoNFTData.vue'
import { LoadingText } from '@/components'
import { formatTimestamp } from '@/lib/formatters'
import { Chain } from '@metalet/utxo-wallet-service'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { useMetaPinsInfiniteQuery } from '@/queries/metaPin'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const size = ref(10)
const router = useRouter()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useMetaPinsInfiniteQuery(address, size, {
  enabled: computed(() => !!address.value),
})

const metaPins = computed(() => (data.value ? data.value.pages.flatMap((page) => page.metaPins) : []))

const toMetaPinDetail = (metaPinId: string) => {
  router.push({
    name: 'metaPinDetail',
    params: { metaPinId, address: address.value },
  })
}
</script>

<template>
  <div class="space-y-4">
    <LoadingText v-if="isLoading" text="MetaID Pins loading..." />
    <div v-else-if="metaPins?.length">
      <div class="px-3 py-4 grid grid-cols-3 gap-x-3 gap-y-7">
        <div
          v-for="metaPin in metaPins"
          @click="toMetaPinDetail(metaPin.id)"
          class="flex flex-col items-center justify-center rounded-md cursor-pointer text-[#999999]"
        >
          <MetaPin
            :content="metaPin.content"
            :value="metaPin.outputValue"
            :contentType="metaPin.contentType"
            :contentSummary="metaPin.contentSummary"
            :contentTypeDetect="metaPin.contentTypeDetect"
          />
          <span class="text-sm text-center mt-3 truncate" :title="'# ' + metaPin.number"># {{ metaPin.number }}</span>
          <span class="text-xs text-center mt-1 h-[30px]">{{ formatTimestamp(metaPin.timestamp) }}</span>
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
        <span>Load more MetaPins</span>
        <LoadingIcon v-if="isFetchingNextPage" class="!text-gray-primary" />
      </div>
    </div>
    <NO_NFT_DATA v-else />
  </div>
</template>

<style lang="less" scoped></style>
