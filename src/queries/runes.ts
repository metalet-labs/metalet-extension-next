import { PageResult } from './types'
import { metaletApiV3, unisatApi } from './request'
import { getNet } from '@/lib/network'
import { Ref, ComputedRef } from 'vue'
import { type RuneAsset } from '@/data/assets'
import { UNISAT_ENABLED } from '@/data/config'
import { AddressRunesTokenSummary } from './types/rune'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'

export interface RuneBalance {
  amount: string
  runeId: string
  rune: string
  spacedRune: string
  symbol: string
  divisibility: number
}

export async function fetchRunesList(
  address: string,
  cursor: number,
  size: number
): Promise<{ list: RuneAsset[]; nextCursor: number | null }> {
  const net = getNet()
  if (UNISAT_ENABLED) {
    const { list, total } = await unisatApi<PageResult<Omit<RuneBalance, 'runeId'> & { runeid: string }>>(
      '/runes/list'
    ).get({
      net,
      address,
      cursor: cursor.toString(),
      size: size.toString(),
    })

    const runeAssets = list.map((data) => ({
      symbol: data.symbol,
      tokenName: data.spacedRune,
      isNative: false,
      chain: 'btc',
      queryable: true,
      decimal: data.divisibility,
      balance: {
        confirmed: Number(data.amount),
        unconfirmed: 0,
        total: Number(data.amount),
      },
      runeId: data.runeid,
    })) as RuneAsset[]

    cursor += size

    return {
      list: runeAssets,
      nextCursor: cursor > total ? null : cursor,
    }
  }

  const { list, total } = await metaletApiV3<PageResult<RuneBalance>>('/runes/address/balance-list').get({
    net,
    address,
    cursor: cursor.toString(),
    size: size.toString(),
  })

  const runeAssets = list.map((data) => ({
    symbol: data.symbol,
    tokenName: data.spacedRune,
    isNative: false,
    chain: 'btc',
    queryable: true,
    decimal: data.divisibility,
    balance: {
      confirmed: Number(data.amount),
      unconfirmed: 0,
      total: Number(data.amount),
    },
    runeId: data.runeId,
  })) as RuneAsset[]

  cursor += size

  return {
    list: runeAssets,
    nextCursor: cursor > total ? null : cursor,
  }
}

export async function fetchRuneDetail(address: string, runeId: string) {
  const net = getNet()
  if (UNISAT_ENABLED) {
    const runeDetail = await unisatApi<AddressRunesTokenSummary>('/runes/token-summary').get({
      net,
      address,
      runeid: runeId,
    })

    return {
      symbol: runeDetail.runeInfo.symbol,
      tokenName: runeDetail.runeInfo.rune,
      isNative: false,
      chain: 'btc',
      queryable: true,
      decimal: runeDetail.runeInfo.divisibility,
      balance: {
        confirmed: Number(runeDetail.runeBalance.amount),
        unconfirmed: 0,
        total: Number(runeDetail.runeBalance.amount),
      },
      runeId,
    } as RuneAsset
  }
  const runeDetail = await metaletApiV3<RuneBalance>('/runes/address/balance-info').get({
    net,
    address,
    runeId,
  })

  return {
    symbol: runeDetail.symbol,
    tokenName: runeDetail.spacedRune,
    isNative: false,
    chain: 'btc',
    queryable: true,
    decimal: runeDetail.divisibility,
    balance: {
      confirmed: Number(runeDetail.amount),
      unconfirmed: 0,
      total: Number(runeDetail.amount),
    },
    runeId,
  } as RuneAsset
}

export const useRuneDetailQuery = (
  address: Ref<string>,
  runeId: Ref<string>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['balance', { address, runeId }],
    queryFn: () => fetchRuneDetail(address.value, runeId.value),
    ...options,
  })
}

export const useRunesInfiniteQuery = (
  address: Ref<string>,
  size: Ref<number>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useInfiniteQuery(
    ['Runes', { address, size }],
    ({ pageParam: cursor = 0 }) => fetchRunesList(address.value, cursor, size.value),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      ...options,
    }
  )
}
