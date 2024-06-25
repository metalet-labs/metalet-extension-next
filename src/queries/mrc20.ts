import Decimal from 'decimal.js'
import { PageResult } from './types'
import { getNet } from '@/lib/network'
import { Ref, ComputedRef } from 'vue'
import { metaletApiV3 } from './request'
import { type MRC20Asset } from '@/data/assets'
import { Chain } from '@metalet/utxo-wallet-service'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'
import { StringOrVNode } from '@/components/ui/toast/use-toast'
import { fetchBtcTxHex } from './transaction'

export interface MRC20UTXO {
  chain: Chain
  blockHeight: number
  address: string
  satoshi: number
  satoshis: number
  scriptPk: string
  txId: string
  vout: number
  outputIndex: number
  mrc20s: MRC20Info[]
  timestamp: number
  confirmed: true
  rawTx?: StringOrVNode
}

interface MRC20Info {
  tick: string
  mrc20Id: string
  txPoint: string
  amount: string
  balance: string
  decimals: string
  tokenName: string
}

export async function getMRC20Utxos(address: string, tickId: string, needRawTx = false) {
  const net = getNet()
  const { list: mrc20Utxos } = await metaletApiV3<{
    total: number
    list: MRC20UTXO[]
  }>(`/mrc20/address/utxo`).get({
    net,
    address,
    tickId,
  })

  if (needRawTx) {
    for (let utxo of mrc20Utxos) {
      utxo.rawTx = await fetchBtcTxHex(utxo.txId)
    }
  }
  return mrc20Utxos
}

export async function fetchMRC20List(
  address: string,
  cursor: number,
  size: number
): Promise<{ list: MRC20Asset[]; nextCursor: number | null }> {
  const net = getNet()

  const { list, total } = await metaletApiV3<PageResult<MRC20Info>>('/mrc20/address/balance-list').get({
    net,
    address,
    cursor: cursor.toString(),
    size: size.toString(),
  })

  const mrc20Assets = list.map((data) => ({
    symbol: data.tick,
    tokenName: data.tokenName,
    isNative: false,
    chain: 'btc',
    queryable: true,
    decimal: Number(data.decimals),
    balance: {
      confirmed: new Decimal(data.balance),
      unconfirmed: new Decimal(0),
      total: new Decimal(data.balance),
    },
    mrc20Id: data.mrc20Id,
  })) as MRC20Asset[]

  cursor += size

  return {
    list: mrc20Assets,
    nextCursor: cursor > total ? null : cursor,
  }
}

export async function fetchMRC20Detail(
  address: string,
  cursor: number,
  size: number,
  mrc20Id: string
): Promise<MRC20Asset | null> {
  const net = getNet()

  const { list } = await metaletApiV3<PageResult<MRC20Info>>('/mrc20/address/balance-list').get({
    net,
    address,
    cursor: cursor.toString(),
    size: size.toString(),
  })

  const data = list.find((item) => item.mrc20Id === mrc20Id)
  if (!data) {
    return null
  }

  return {
    symbol: data.tick,
    tokenName: data.tokenName,
    isNative: false,
    chain: 'btc',
    queryable: true,
    decimal: Number(data.decimals),
    balance: {
      confirmed: new Decimal(data.balance),
      unconfirmed: new Decimal(0),
      total: new Decimal(data.balance),
    },
    mrc20Id: data.mrc20Id,
  } as MRC20Asset
}

export const useMRC20DetailQuery = (
  address: Ref<string>,
  size: Ref<number>,
  mrc20Id: Ref<string>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['MRC20List', { address, size, mrc20Id }],
    queryFn: () => fetchMRC20Detail(address.value, 0, size.value, mrc20Id.value),
    ...options,
  })
}

export const useMRC20sInfiniteQuery = (
  address: Ref<string>,
  size: Ref<number>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useInfiniteQuery(
    ['MRC20List', { address, size }],
    ({ pageParam: cursor = 0 }) => fetchMRC20List(address.value, cursor, size.value),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      ...options,
    }
  )
}
