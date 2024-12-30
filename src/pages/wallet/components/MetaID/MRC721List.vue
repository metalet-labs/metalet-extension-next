<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import NO_NFT_DATA from './NoNFTData.vue'
import { LoadingText } from '@/components'
import { Chain } from '@metalet/utxo-wallet-service'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import CollectionItems from './CollectionItems.vue'
import { useMRC721CollectionsInfiniteQuery } from '@/queries/mrc721'

const router = useRouter()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

const {
  data: collectionsData,
  isLoading: isLoadingCollections,
  hasNextPage: hasNextCollections,
  fetchNextPage: fetchNextCollections,
  isFetchingNextPage: isFetchingNextCollections,
} = useMRC721CollectionsInfiniteQuery(
  address,
  computed(() => 9)
)

const collections = computed(() =>
  collectionsData.value ? collectionsData.value.pages.flatMap((page) => page.list) : []
)

const handleSelectItem = (itemPinId: string) => {
  if (!address.value) return
  router.push({
    name: 'mrc721Detail',
    params: { metaPinId: itemPinId, address: address.value },
  })
}
</script>

<template>
  <div class="space-y-4">
    <LoadingText v-if="isLoadingCollections" :text="$t('Common.DataLoading')" />
    <div v-else-if="collections.length">
      <div v-for="collection in collections" :key="collection.pinId">
        <CollectionItems :collection="collection" @select-item="handleSelectItem" />
      </div>
      <div
        v-if="hasNextCollections"
        :disabled="isFetchingNextCollections"
        @click="() => fetchNextCollections()"
        :class="[
          'text-gray-primary flex items-center gap-2 justify-center mt-4',
          !isFetchingNextCollections ? 'cursor-pointer hover:text-blue-500 hover:underline' : 'cursor-not-allowed',
        ]"
      >
        <span class="text-sm">{{ $t('Common.LoadMore') }} collections</span>
        <LoadingIcon v-if="isFetchingNextCollections" class="!text-gray-primary" />
      </div>
    </div>
    <NO_NFT_DATA v-else />
  </div>
</template>

<style lang="less" scoped></style>
