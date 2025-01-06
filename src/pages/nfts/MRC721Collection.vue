<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { LoadingText } from '@/components'
import { getMetaFileUrl } from '@/lib/mrc721'
import { useRoute, useRouter } from 'vue-router'
import { Chain } from '@metalet/utxo-wallet-service'
import LoadingIcon from '@/components/LoadingIcon.vue'
import MRC721 from '@/pages/wallet/components/MetaID/MRC721.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { 
  useMRC721CollectionItemsInfiniteQuery, 
  useMRC721CollectionQuery,
  useMRC721CollectionAllItemsInfiniteQuery 
} from '@/queries/mrc721'

const route = useRoute()
const router = useRouter()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)
const pinId = ref(route.params.pinId as string)

const { data: collection, isLoading: isLoadingCollection } = useMRC721CollectionQuery(pinId.value)

const {
  data: myItemsData,
  isLoading: isLoadingMyItems,
} = useMRC721CollectionItemsInfiniteQuery(
  address,
  pinId,
  computed(() => 1000)
)

const myItemIds = computed(() => {
  if (!myItemsData.value) return new Set()
  return new Set(myItemsData.value.pages.flatMap(page => page.list).map(item => item.itemPinId))
})

const {
  data: allItemsData,
  isLoading: isLoadingAllItems,
  hasNextPage: hasNextAllPage,
  fetchNextPage: fetchNextAllPage,
  isFetchingNextPage: isFetchingNextAllPage,
} = useMRC721CollectionAllItemsInfiniteQuery(
  pinId,
  computed(() => 9)
)

const allItems = computed(() => {
  if (!allItemsData.value) return []
  const items = allItemsData.value.pages.flatMap((page) => page.list)
  return items.filter(item => myItemIds.value.has(item.itemPinId))
})

const coverUrl = computed(() => (collection.value ? getMetaFileUrl(collection.value.cover) : ''))

const handleSelectItem = (itemPinId: string) => {
  if (!address.value) return
  router.push({
    name: 'mrc721Detail',
    params: { metaPinId: itemPinId, address: address.value },
  })
}

const isDescExpanded = ref(false)

const handleLoadMore = async () => {
  const oldItemsCount = allItems.value.length
  await fetchNextAllPage()
  // 等待 DOM 更新
  await nextTick()
  // 获取新加载的第一个元素
  const firstNewItem = document.querySelector(`[data-index="${oldItemsCount}"]`)
  if (firstNewItem) {
    firstNewItem.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <LoadingText v-if="isLoadingCollection" :text="$t('Common.DataLoading')" />
    <template v-else-if="collection">
      <div class="sticky top-0 bg-white z-50">
        <div class="flex flex-col gap-3 pb-4">
          <div class="flex items-start gap-3">
            <img :src="coverUrl" class="object-contain size-20 rounded-lg" alt="avatar" />
            <div>
              <h1 class="text-xl font-medium">{{ collection.name }}</h1>
              <div class="text-sm text-gray-500">{{ $t('Common.Total') }}: {{ collection.totalNum }}</div>
            </div>
          </div>

          <div class="relative">
            <div class="flex flex-col">
              <div class="text-sm text-gray-500" :class="{ 'line-clamp-3': !isDescExpanded }">{{ collection.desc }}</div>
              <div
                v-if="collection.desc && collection.desc.length > 100"
                @click="isDescExpanded = !isDescExpanded"
                class="text-sm text-blue-500 cursor-pointer hover:underline"
              >
                {{ isDescExpanded ? $t('Common.ShowLess') : $t('Common.ShowMore') }}
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100">
          <div class="text-lg font-medium pt-4">{{ $t('Common.MyNFTs') }}</div>
        </div>
      </div>

      <div class="relative">
        <LoadingText v-if="isLoadingAllItems || isLoadingMyItems" :text="$t('Common.DataLoading')" />
        <template v-else>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="(item, index) in allItems"
              :key="item.itemPinId"
              :data-index="index"
              @click="handleSelectItem(item.itemPinId)"
              class="flex flex-col items-center justify-center cursor-pointer relative"
            >
              <MRC721
                :cover="item.cover"
                :pop="item.name"
                :pop-lv="item.popLv"
                :value="item.outValue"
                :content="item.content"
                :content-summary="item.desc"
              />

              <div class="mt-2 text-center">
                <div class="text-base font-medium">{{ item?.name || '--' }}</div>
                <div class="text-sm text-gray-500">
                  <span v-if="item.itemPinNumber !== -1"># {{ item.itemPinNumber }}</span>
                  <span v-else>{{ $t('Common.Unconfirmed') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="hasNextAllPage"
            :disabled="isFetchingNextAllPage"
            @click="handleLoadMore"
            :class="[
              'text-gray-primary flex items-center gap-2 justify-center mt-4',
              !isFetchingNextAllPage ? 'cursor-pointer hover:text-blue-500 hover:underline' : 'cursor-not-allowed',
            ]"
          >
            <span class="text-sm">{{ $t('Common.LoadMore') }} NFTs</span>
            <LoadingIcon v-if="isFetchingNextAllPage" class="!text-gray-primary" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
