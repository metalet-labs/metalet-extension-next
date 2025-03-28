<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatTimestamp } from '@/lib/formatters'
import { Chain } from '@metalet/utxo-wallet-service'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { useMetaPinsInfiniteQuery } from '@/queries/metaPin'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import MetaPin from '@/pages/wallet/components/MetaID/MetaPin.vue'

const size = ref(9)
const router = useRouter()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useMetaPinsInfiniteQuery(address, size, {
  enabled: computed(() => !!address.value),
})

const metaPins = computed(() =>
  data.value
    ? data.value.pages.flatMap((page) => page.metaPins.filter((pin) => pin.path.startsWith('/nft/mrc721')))
    : []
)

const toMetaPinDetail = (metaPinId: string) => {
  router.push({
    name: 'metaPinDetail',
    params: { metaPinId, address: address.value },
  })
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="w-full py-3 text-center text-sm text-gray-500">MetaID Pins loading...</div>
    <div v-else-if="metaPins?.length">
      <div class="mt-12 px-3 py-4 grid grid-cols-3 gap-x-3 gap-y-7">
        <div
          v-for="metaPin in metaPins"
          @click="toMetaPinDetail(metaPin.id)"
          class="flex flex-col items-center justify-center rounded-md cursor-pointer text-[#999999]"
        >
          <div>{{ metaPin.path }}</div>
          <MetaPin
            :path="metaPin.path"
            :content="metaPin.content"
            :value="metaPin.outputValue"
            :content-type="metaPin.contentType"
            :content-summary="metaPin.contentSummary"
            :content-type-detect="metaPin.contentTypeDetect"
            :pop="metaPin.pop"
            :pop-lv="metaPin.popLv"
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
    <div v-else class="w-full py-3 text-center text-sm text-gray-500">No MetaID Pins yet</div>
  </div>
</template>

<style lang="less" scoped></style>
