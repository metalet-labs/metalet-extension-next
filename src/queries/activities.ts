import Decimal from 'decimal.js'
import { PageResult } from './types'
import { getNet } from '@/lib/network'
import { ComputedRef, Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { CoinCategory } from './exchange-rates'
import { SymbolTicker } from '@/lib/asset-symbol'
import { Activities_QUERY_INTERVAL } from './constants'
import { metaletApiV3, metaletApiV4 } from './request'
import type { FTAsset, Asset, MRC20Asset } from '@/data/assets'

export type Operation = {
  flag: string
  time: number
  amount: number
  txId: string
  confirmed: boolean
}

export type Activity = {
  address: string
  flag: string
  time: number
  height: number
  income: number
  outcome: number
  txid: string
  actionType?: string
}

export type TokenActivity = {
  codeHash: string
  genesis: string
} & Activity
type Activities = ReadonlyArray<Activity>
type TokenActivities = ReadonlyArray<TokenActivity>

type BtcRawActivity = {
  amount: string
  from: string
  height: string
  to: string
  txId: string
  txFee: string
  transactionTime: string
}

type BRC20RawActivity = {
  txId: string
  blockHeight: string
  state: string
  tokenType: string
  actionType: string
  fromAddress: string
  toAddress: string
  amount: string
  token: string
  inscriptionId: string
  inscriptionNumber: string
  index: string
  location: string
  msg: string
  time: string
}

export const fetchBtcActivities = async (address: string): Promise<Activities> => {
  return metaletApiV3<{ transactionList: BtcRawActivity[] }>(`/address/activities`)
    .get({
      address,
      chain: 'btc',
    })
    .then((data) => data.transactionList)
    .then((activities) => {
      return activities.map((activity) => {
        return {
          address: activity.from,
          flag: '',
          time: Number(activity.transactionTime),
          height: Number(activity.height),
          income: new Decimal(activity.amount).times(1e8).toNumber(),
          outcome: 0,
          txid: activity.txId,
        }
      })
    })
}

export const fetchBRC20Activities = async (address: string, symbol: SymbolTicker): Promise<Activities> => {
  return metaletApiV3<{ inscriptionsList: BRC20RawActivity[] }>(`/address/brc20/activities`)
    .get({
      address,
      chain: 'btc',
      tick: symbol.toLocaleLowerCase(),
    })
    .then((data) => data.inscriptionsList)
    .then((activities) => {
      return activities.map((activity) => {
        return {
          address: activity.fromAddress,
          flag: '',
          time: Number(activity.time),
          height: Number(activity.blockHeight),
          income: activity.toAddress === address ? Number(activity.amount) : 0,
          outcome: activity.fromAddress === address ? Number(activity.amount) : 0,
          txid: activity.txId,
          actionType: activity.actionType,
        }
      })
    })
}

interface MRC20Activity {
  txId: string
  tickId: string
  tokenName: string
  decimals: string
  from: string
  to: string
  amount: string
  txType: number
  timestamp: number
  height: number
}

export const fetchMRC20Activities = async (address: string, tickId: string): Promise<Activities> => {
  const net = getNet()
  return metaletApiV3<PageResult<MRC20Activity>>(`/mrc20/address/activities`)
    .get({
      net,
      tickId,
      address,
    })
    .then((data) => data.list)
    .then((activities) => {
      return activities.map((activity) => {
        return {
          flag: '',
          height: activity.height,
          txid: activity.txId,
          address: activity.from,
          time: Number(activity.timestamp * 1000),
          actionType: activity.txType === 2 ? 'Mint' : activity.txType === 3 ? 'Deploy' : '',
          income:
            activity.to === address ? new Decimal(activity.amount).mul(10 ** Number(activity.decimals)).toNumber() : 0,
          outcome:
            activity.from === address && activity.txType !== 2
              ? new Decimal(activity.amount).mul(10 ** Number(activity.decimals)).toNumber()
              : 0,
        }
      })
    })
}

export const fetchSpaceActivities = async (address: string): Promise<Activities> => {
  const net = getNet()
  const { list } = await metaletApiV4<PageResult<Activity>>(`/mvc/address/tx-list`).get({
    net,
    address,
    cursor: '0',
    size: '100000',
  })
  return list
}

export const fetchTokenActivities = async (address: string, asset: FTAsset): Promise<TokenActivities> => {
  const net = getNet()
  const { list } = await metaletApiV4<PageResult<TokenActivity>>(`/mvc/address/contract/ft/tx-list`).get({
    net,
    address,
    cursor: '0',
    size: '100000',
    genesis: asset.genesis,
    codeHash: asset.codeHash,
  })
  return list
}

export const useActivitiesQuery = (address: Ref<string>, asset: Asset, options?: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['activities', { address, symbol: asset.symbol, genesis: (asset as FTAsset).genesis }],
    queryFn: async () => {
      if (asset.symbol === 'BTC') {
        return fetchBtcActivities(address.value)
      } else if (asset.symbol === 'SPACE') {
        return fetchSpaceActivities(address.value)
      } else if (asset.contract === CoinCategory.BRC20) {
        return fetchBRC20Activities(address.value, asset.symbol)
      } else if (asset.contract === CoinCategory.MetaContract) {
        return fetchTokenActivities(address.value, asset as FTAsset)
      } else if (asset.contract === CoinCategory.MRC20) {
        return fetchMRC20Activities(address.value, (asset as MRC20Asset).mrc20Id)
      } else {
        return []
      }
    },
    refetchInterval: Activities_QUERY_INTERVAL,
    ...options,
  })
}
