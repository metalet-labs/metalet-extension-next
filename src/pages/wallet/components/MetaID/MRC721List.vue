<script setup lang="ts">
import MRC721 from './MRC721.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NO_NFT_DATA from './NoNFTData.vue'
import { LoadingText } from '@/components'
import { Chain } from '@metalet/utxo-wallet-service'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { useMetaPinsInfiniteQuery } from '@/queries/metaPin'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

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

const groupedMetaPins = computed(() => {
  return metaPins.value.reduce((acc, pin) => {
    if (!acc[pin.path]) {
      acc[pin.path] = []
    }
    acc[pin.path].push(pin)
    return acc
  }, {} as any)
})

const toMetaPinDetail = (metaPinId: string) => {
  router.push({
    name: 'mrc721Detail',
    params: { metaPinId, address: address.value },
  })
}
</script>

<template>
  <div class="space-y-4">
    <LoadingText v-if="isLoading" text="MetaID Pins loading..." />
    <div v-else-if="Object.keys(groupedMetaPins).length">
      <div v-for="(group, path) in groupedMetaPins" :key="path">
        <h3>{{ path.toString().replace('/nft/mrc721/', '') }}</h3>
        <div class="px-3 py-4 grid grid-cols-3 gap-x-3 gap-y-7 items-start">
          <div
            v-for="metaPin in group"
            @click="toMetaPinDetail(metaPin.id)"
            class="flex flex-col items-center justify-center rounded-md cursor-pointer text-[#999999]"
          >
            <MRC721
              :pop="metaPin.pop"
              :popLv="metaPin.popLv"
              :value="metaPin.outputValue"
              :contentSummary="metaPin.contentSummary"
            />

            <span class="text-xs text-center mt-3 truncate" title="Unconfirmed" v-if="metaPin.number === -1">
              Unconfirmed
            </span>
            <span class="text-sm text-center mt-3 truncate" :title="'# ' + metaPin.number" v-else>
              # {{ metaPin.number }}
            </span>
            <span class="text-xs text-center mt-1 truncate w-16" :title="metaPin.path">{{ metaPin.path }}</span>
            <span class="text-xs text-center mt-1 break-all">{{ metaPin.pop }}</span>
          </div>
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
        <span class="text-sm">Load more MetaPins</span>
        <LoadingIcon v-if="isFetchingNextPage" class="!text-gray-primary" />
      </div>
    </div>
    <NO_NFT_DATA v-else />
  </div>
</template>

<style lang="less" scoped></style>
