<script setup lang="ts">
import { computed } from 'vue'
import MRC721 from './MRC721.vue'
import { LoadingText } from '@/components'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import { ChevronRight } from 'lucide-vue-next'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useMRC721CollectionItemsInfiniteQuery } from '@/queries/mrc721'
import { getMetaFileUrl, type MRC721Collection } from '@/lib/mrc721'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  collection: MRC721Collection
}>()

const emit = defineEmits<{
  (e: 'select-item', itemPinId: string): void
}>()

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useMRC721CollectionItemsInfiniteQuery(
  address,
  computed(() => props.collection.pinId),
  computed(() => 3),
  {
    enabled: computed(() => !!address.value && !!props.collection.pinId),
  }
)

const items = computed(() => (data.value ? data.value.pages.flatMap((page) => page.list) : []))

const coverUrl = computed(() => getMetaFileUrl(props.collection.cover))
</script>

<template>
  <div class="space-y-4 py-2">
    <RouterLink
      :to="{ name: 'mrc721Collection', params: { pinId: collection.pinId } }"
      class="flex items-center justify-between cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <img :src="coverUrl" class="object-contain size-10 rounded-md" />
        <div>
          <h3 class="text-base font-medium">{{ collection.collectionName }}</h3>
          <div class="text-sm text-gray-500">{{ collection.totalNum }}</div>
        </div>
      </div>
      <ChevronRight class="w-5 h-5" />
    </RouterLink>
    <LoadingText v-if="isLoading" :text="$t('Common.DataLoading')" />
    <template v-else>
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="item in items"
          :key="item.itemPinId"
          @click="emit('select-item', item.itemPinId)"
          class="flex flex-col items-center justify-center cursor-pointer"
        >
          <MRC721
            :pop="item.outpoint"
            :popLv="0"
            :value="item.outValue"
            :content="item.contentString"
            :contentSummary="item.desc || item.name"
          />

          <div class="mt-2 text-center">
            <div class="text-base font-medium">{{ item?.name ?? '--' }}</div>
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
