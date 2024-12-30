<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoadingText } from '@/components'
import { Chain } from '@metalet/utxo-wallet-service'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useMRC721CollectionItemsInfiniteQuery } from '@/queries/mrc721'
import { getMRC721CollectionInfo, getMetaFileUrl } from '@/lib/mrc721'
import { useQuery } from '@tanstack/vue-query'

const router = useRouter()
const route = useRoute()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)
const pinId = ref(route.params.pinId as string)

const { data: collection, isLoading: isLoadingCollection } = useQuery({
  queryKey: ['MRC721Collection', pinId],
  queryFn: () => getMRC721CollectionInfo(pinId.value),
  enabled: computed(() => !!pinId.value),
})

const {
  data: itemsData,
  isLoading: isLoadingItems,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
} = useMRC721CollectionItemsInfiniteQuery(
  address,
  pinId,
  computed(() => 9)
)

const items = computed(() => (itemsData.value ? itemsData.value.pages.flatMap((page) => page.list) : []))

const coverUrl = computed(() => (collection.value ? getMetaFileUrl(collection.value.cover) : ''))

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
    <LoadingText v-if="isLoadingCollection" :text="$t('Common.DataLoading')" />
    <template v-else-if="collection">
      <div class="flex items-center gap-3">
        <img :src="coverUrl" class="object-contain size-20 rounded-lg" />
        <div class="space-y-1">
          <h1 class="text-xl font-medium">{{ collection.name }}</h1>
          <div class="text-sm text-gray-500">{{ collection.desc }}</div>
          <div class="text-sm text-gray-500">Amount: {{ collection.totalNum }}</div>
        </div>
      </div>

      <div class="border-t border-gray-100 pt-4">
        <div class="text-lg font-medium mb-4">{{ $t('Common.Collection') }}</div>
        <LoadingText v-if="isLoadingItems" :text="$t('Common.DataLoading')" />
        <template v-else>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="item in items"
              :key="item.itemPinId"
              @click="handleSelectItem(item.itemPinId)"
              class="flex flex-col items-center justify-center cursor-pointer"
            >
              <div class="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-gray-100">
                <img
                  :src="getMetaFileUrl(item.contentString)"
                  :alt="item.name"
                  class="w-full h-full object-contain"
                  v-if="item.contentString"
                />
                <div class="overflow-hidden line-clamp-6 text-xs break-all p-1.5" v-else>{{ item.desc }}</div>
                <span
                  :title="`${item.outValue} sat`"
                  class="absolute rounded right-0 bottom-1 py-3px px-1.5 bg-[#E2F4FF]/80 text-[#1472FF] text-xs scale-75"
                >
                  {{ item.outValue }} sat
                </span>
              </div>

              <div class="mt-2 text-center">
                <div class="text-base font-medium">{{ item.name }}</div>
                <div class="text-sm text-gray-500">
                  <span v-if="item.itemPinNumber !== -1"># {{ item.itemPinNumber }}</span>
                  <span v-else>{{ $t('Common.Unconfirmed') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="hasNextPage"
            :disabled="isFetchingNextPage"
            @click="() => fetchNextPage()"
            :class="[
              'text-gray-primary flex items-center gap-2 justify-center mt-4',
              !isFetchingNextPage ? 'cursor-pointer hover:text-blue-500 hover:underline' : 'cursor-not-allowed',
            ]"
          >
            <span class="text-sm">{{ $t('Common.LoadMore') }} NFTs</span>
            <LoadingIcon v-if="isFetchingNextPage" class="!text-gray-primary" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
