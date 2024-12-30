import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'
import { Ref, ComputedRef, computed } from 'vue'
import { 
  getMRC721ItemInfo, 
  fetchMRC721Collections, 
  fetchMRC721CollectionItems,
  type MRC721Collection, 
  type MRC721Item 
} from '@/lib/mrc721'

export function useMRC721CollectionsInfiniteQuery(
  address: Ref<string> | ComputedRef<string>,
  size: Ref<number> | ComputedRef<number> = computed(() => 10)
) {
  return useInfiniteQuery({
    queryKey: ['MRC721Collections', { address: address.value, size: size.value }],
    queryFn: ({ pageParam }) => fetchMRC721Collections(address.value, pageParam, size.value),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: computed(() => !!address.value),
  })
}

export function useMRC721CollectionItemsInfiniteQuery(
  address: Ref<string> | ComputedRef<string>,
  pinId: Ref<string> | ComputedRef<string>,
  size: Ref<number> | ComputedRef<number> = computed(() => 10),
  options?: { enabled?: Ref<boolean> | ComputedRef<boolean> }
) {
  return useInfiniteQuery({
    queryKey: ['MRC721CollectionItems', { address: address.value, pinId: pinId.value, size: size.value }],
    queryFn: ({ pageParam }) => fetchMRC721CollectionItems(address.value, pinId.value, pageParam, size.value),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: computed(() => {
      if (options?.enabled !== undefined) {
        return options.enabled.value
      }
      return !!address.value && !!pinId.value
    }),
  })
}

export function useMRC721ItemQuery(pinId: string | undefined) {
  return useQuery({
    queryKey: ['MRC721Item', pinId],
    queryFn: () => getMRC721ItemInfo(pinId!),
    enabled: computed(() => !!pinId),
  })
}
