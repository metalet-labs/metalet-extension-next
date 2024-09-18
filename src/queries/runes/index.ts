import { UTXO } from '../utxos'
import Decimal from 'decimal.js'
import { PageResult } from '../types'
import { getNet } from '@/lib/network'
import { type RuneAsset } from '@/data/assets'
import { UNISAT_ENABLED } from '@/data/config'
import { CoinCategory } from '../exchange-rates'
import { Ref, ComputedRef, computed } from 'vue'
import { Balance_QUERY_INTERVAL } from '../constants'
import { AddressRunesTokenSummary } from '../types/rune'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'
import { metaletApiV3, unisatApi, ordersApi, swapApi } from '../request'

export type SwapType = '1x' | 'x2' | '2x' | 'x1'

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
        confirmed: new Decimal(data.amount),
        unconfirmed: new Decimal(0),
        total: new Decimal(data.amount),
      },
      runeId: data.runeid,
      contract: CoinCategory.Runes,
    })) as RuneAsset[]

    cursor += size

    return {
      list: runeAssets,
      nextCursor: cursor >= total ? null : cursor,
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
        confirmed: new Decimal(runeDetail.runeBalance.amount),
        unconfirmed: new Decimal(0),
        total: new Decimal(runeDetail.runeBalance.amount),
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

export const previewSwap = async ({
  token1,
  token2,
  address,
  swapType,
  sourceAmount,
}: {
  address: string
  token1: string
  token2: string
  swapType: SwapType
  sourceAmount: string
}): Promise<{
  gas: string
  ratio: string
  poolRatio: string
  serviceFee: string
  sourceAmount: string
  targetAmount: string
  priceImpact: string
}> => {
  return await swapApi<{
    gas: string
    ratio: string
    poolRatio: string
    serviceFee: string
    sourceAmount: string
    targetAmount: string
    priceImpact: string
  }>('/preview/swap').post({
    token1,
    token2,
    address,
    swapType,
    sourceAmount,
  })
}

export const build1xSwap = async ({
  address,
  pubkey,
  token1,
  token2,
  sourceAmount,
  feeRate,
}: {
  address: string
  pubkey: string
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
}): Promise<{
  rawPsbt: string
  buildId: string
  type: string
  feeRate: number
}> => {
  const res = await swapApi<{
    rawPsbt: string
    buildId: string
    type: string
  }>('/build/1x').post({
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    feeRate,
  })
  return {
    ...res,
    feeRate,
  }
}

export const buildX2Swap = async ({
  address,
  pubkey,
  token1,
  token2,
  sourceAmount,
  feeRate,
}: {
  address: string
  pubkey: string
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
}): Promise<{
  rawPsbt: string
  buildId: string
  type: string
  feeRate: number
}> => {
  const res = await swapApi<{
    rawPsbt: string
    buildId: string
    type: string
  }>('/build/x2').post({
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    feeRate,
  })
  return {
    ...res,
    feeRate,
  }
}

export const build2xSwap = async ({
  address,
  pubkey,
  token1,
  token2,
  sourceAmount,
  feeRate,
  runeUtxos,
}: {
  address: string
  pubkey: string
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
  runeUtxos: UTXO[]
}): Promise<{
  rawPsbt: string
  buildId: string
  type: string
  feeRate: number
}> => {
  const res = await swapApi<{
    rawPsbt: string
    buildId: string
    type: string
  }>('/build/2x').post({
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    runeUtxos,
    feeRate,
  })
  return {
    ...res,
    feeRate,
  }
}

export const buildX1Swap = async ({
  address,
  pubkey,
  token1,
  token2,
  sourceAmount,
  feeRate,
  runeUtxos,
}: {
  address: string
  pubkey: string
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
  runeUtxos: UTXO[]
}): Promise<{
  rawPsbt: string
  buildId: string
  type: string
  feeRate: number
}> => {
  const res = await swapApi<{
    rawPsbt: string
    buildId: string
    type: string
  }>('/build/x1').post({
    address,
    pubkey,
    token1,
    token2,
    sourceAmount,
    runeUtxos,
    feeRate,
  })
  return {
    ...res,
    feeRate,
  }
}
