import { network } from '@/lib/network'
import { PageResult } from '@/queries/types'
import { metaletApiV4 } from '@/queries/request'
import { Ref, ComputedRef, computed } from 'vue'
import { MRC721Collection, MRC721Item } from '@/lib/mrc721'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'

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
    queryFn: ({ pageParam = 0 }) => fetchMRC721CollectionItems(address.value, pinId.value, pageParam, size.value),
    getNextPageParam: (lastPage, pages) => {
      const loadedItemsCount = pages.reduce((total, page) => total + page.list.length, 0)
      return loadedItemsCount < lastPage.total ? loadedItemsCount : undefined
    },
    enabled: computed(() => {
      if (options?.enabled !== undefined) {
        return options.enabled.value
      }
      return !!address.value && !!pinId.value
    }),
  })
}

export function useMRC721CollectionAllItemsInfiniteQuery(
  pinId: Ref<string> | ComputedRef<string>,
  size: Ref<number> | ComputedRef<number> = computed(() => 10),
  options?: { enabled?: Ref<boolean> | ComputedRef<boolean> }
) {
  return useInfiniteQuery({
    queryKey: ['MRC721CollectionAllItems', { pinId: pinId.value, size: size.value }],
    queryFn: ({ pageParam = 0 }) => fetchMRC721CollectionAllItems(pinId.value, pageParam, size.value),
    getNextPageParam: (lastPage, pages) => {
      const loadedItemsCount = pages.reduce((total, page) => total + page.list.length, 0)
      return loadedItemsCount < lastPage.total ? loadedItemsCount : undefined
    },
    enabled: computed(() => {
      if (options?.enabled !== undefined) {
        return options.enabled.value
      }
      return !!pinId.value
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

export function useMRC721CollectionQuery(pinId: string | undefined) {
  return useQuery({
    queryKey: ['MRC721Collection', pinId],
    queryFn: () => getMRC721CollectionInfo(pinId!),
    enabled: computed(() => !!pinId),
  })
}

export async function getMRC721ItemInfo(pinId: string): Promise<MRC721Item> {
  const net = network.value
  return await metaletApiV4<MRC721Item>('/man/mrc721/item-info').get({
    net,
    pinId,
  })
}

export async function getMRC721CollectionInfo(pinId: string): Promise<MRC721Collection> {
  const net = network.value
  return await metaletApiV4<MRC721Collection>('/man/mrc721/collection-info').get({
    net,
    pinId,
  })
}

export async function fetchMRC721Collections(
  address: string,
  cursor?: string,
  size = 10
): Promise<PageResult<MRC721Collection>> {
  const net = network.value
  return await metaletApiV4<PageResult<MRC721Collection>>('/man/mrc721/address/collection-list').get({
    net,
    address,
    cursor,
    size,
  })
}

export async function fetchMRC721CollectionItems(
  address: string,
  pinId: string,
  cursor?: string,
  size = 10
): Promise<PageResult<MRC721Item>> {
  const net = network.value
  return await metaletApiV4<PageResult<MRC721Item>>('/man/mrc721/address/collection/item-list').get({
    net,
    address,
    pinId,
    cursor,
    size,
  })
}

export async function fetchMRC721CollectionAllItems(
  pinId: string,
  cursor?: string,
  size = 10
): Promise<PageResult<MRC721Item>> {
  const net = network.value
  return await metaletApiV4<PageResult<MRC721Item>>('/man/mrc721/collection/item-list').get({
    net,
    pinId,
    cursor,
    size,
  })
}
