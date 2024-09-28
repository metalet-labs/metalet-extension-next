import Decimal from 'decimal.js'
import { PageResult } from '../types'
import { getNet } from '@/lib/network'
import { type RuneAsset } from '@/data/assets'
import { Ref, ComputedRef, computed } from 'vue'
import { metaletApiV3, ordersApi } from '../request'
import { Balance_QUERY_INTERVAL } from '../constants'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'

export interface RuneBalance {
  amount: string
  runeId: string
  rune: string
  spacedRune: string
  symbol: string
  divisibility: number
  mintable: boolean
  termsAmount: string
  remainingMint: string
}

export async function fetchRunesList(
  address: string,
  cursor: number,
  size: number
): Promise<{ list: RuneAsset[]; nextCursor: number | null }> {
  const net = getNet()
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
      confirmed: new Decimal(data.amount),
      unconfirmed: new Decimal(0),
      total: new Decimal(data.amount),
    },
    runeId: data.runeId,
    contract: 'Runes',
  })) as RuneAsset[]

  cursor += size

  return {
    list: runeAssets,
    nextCursor: cursor >= total ? null : cursor,
  }
}

export async function fetchRuneDetail(address: string, runeId: string) {
  const net = getNet()
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
      confirmed: new Decimal(runeDetail.amount),
      unconfirmed: new Decimal(0),
      total: new Decimal(runeDetail.amount),
    },
    runeId,
    mintable: runeDetail.mintable,
    termsAmount: runeDetail.termsAmount,
    remainingMint: runeDetail.remainingMint,
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

export const useRunesAssetsQuery = (address: Ref<string>, options: { enabled: Ref<boolean> }) => {
  return useQuery({
    queryKey: ['RuneAssets', { address }],
    queryFn: () => fetchRunesList(address.value, 0, 1000),
    select: (data) => data.list,
    refetchInterval: Balance_QUERY_INTERVAL,
    ...options,
  })
}

export async function fetchRuneUtxoDetail(txid: string, index: number) {
  const { data: runeDetailList } = await ordersApi<{ data: (Omit<RuneBalance, 'runeId'> & { runeid: string })[] }>(
    '/runes/utxo-balance'
  ).get({
    txid,
    index,
  })

  return runeDetailList.map((runeDetail) => ({
    chain: 'btc',
    isNative: false,
    queryable: true,
    symbol: runeDetail.symbol,
    amount: runeDetail.amount,
    runeId: runeDetail.runeid,
    tokenName: runeDetail.spacedRune,
    decimal: runeDetail.divisibility,
  }))
}

export async function decipherRuneScript(script: string) {
  const { spec } = await ordersApi<{ spec: object }>('/runes/decipher').post({
    script,
  })
  return JSON.stringify(spec)
}

export type RuneToken = {
  runeid: string
  rune: string
  spacedRune: string
  number: number
  height: number
  txid: number
  timestamp: number
  divisibility: number
  symbol: string
  etching: string
  premine: string
  terms: null | string
  mints: string
  burned: string
  holders: number
  transactions: number
  supply: string
  start: null | string
  end: null | string
  mintable: boolean
  remaining: string
}

export const getRunesTokens = async ({ keyword }: { keyword: string }): Promise<RuneToken[]> => {
  const {
    data: { detail },
  } = await ordersApi<{ data: { detail: RuneToken[] } }>(`/runes/list`).get({ runename: keyword })

  return detail
}

export const getRunesTokensQuery = (
  filters: {
    keyword: Ref<string>
  },
  enabled: ComputedRef<boolean> = computed(() => true)
) =>
  useQuery({
    queryKey: ['runesTokens', filters],
    queryFn: () => getRunesTokens({ keyword: filters.keyword.value }),
    enabled,
  })
