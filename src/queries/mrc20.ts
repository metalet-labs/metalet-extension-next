import Decimal from 'decimal.js'
import { type UTXO } from './utxos'
import { PageResult } from './types'
import { Ref, ComputedRef } from 'vue'
import { metaletApiV3 } from './request'
import { fetchBtcTxHex } from './transaction'
import { fetchDogeTxHex } from './doge/utxos'
import { COMMON_INTERVAL } from './constants'
import { getNet, network } from '@/lib/network'
import { type MRC20Asset } from '@/data/assets'
import { CoinCategory } from './exchange-rates'
import { Chain } from '@metalet/utxo-wallet-service'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'

interface ShovelMetaIdPin {
  id: string
  number: number
  metaid: string
  address: string
  creator: string
  initialOwner: string
  output: string
  outputValue: number
  timestamp: number
  genesisFee: number
  genesisHeight: number
  genesisTransaction: string
  txIndex: number
  txInIndex: number
  offset: number
  location: string
  operation: string
  path: string
  parentPath: string
  originalPath: string
  encryption: string
  version: string
  contentType: string
  contentTypeDetect: string
  contentBody: string
  contentLength: number
  contentSummary: string
  status: number
  originalId: string
  transfer: string
  isTransfered: boolean
  preview: string
  content: string
  pop: string
  popLv: number
  chainName: string
  dataValue: number
  mrc20Minted: boolean
  mrc20MintPin: string
}

export interface MetaIdPinUTXO extends UTXO {
  id: string
  pop: string
  popLv: number
  content: string
  contentType: string
  contentSummary: string
  contentTypeDetect: string
}

export interface MRC20UTXO extends UTXO {
  chain: Chain
  address: string
  scriptPk: string
  timestamp: number
  mrc20s: MRC20Info[]
  blockHeight: number
}

interface MRC20Info {
  tick: string
  mrc20Id: string
  txPoint: string
  amount: string
  balance: string
  decimals: string
  metaData: string
  tokenName: string
  unsafeAmount: string
  unsafeBalance: string
  pendingInBalance: string
  pendingOutBalance: string
  deployAddress: string
  deployUserInfo: {
    name: string
    avatar: string
  }
  tag: 'id-coins' | string
}

export async function getMRC20Utxos(address: string, tickId: string, needRawTx = false, chain: 'btc' | 'doge' = 'btc') {
  const net = getNet()
  const { list: mrc20Utxos } = await metaletApiV3<{
    total: number
    list: MRC20UTXO[]
  }>(`/mrc20/address/utxo`).get({
    net,
    address,
    tickId,
    source: 'mrc20-v2',
  })

  if (needRawTx) {
    for (let utxo of mrc20Utxos) {
      // 根据链类型使用不同的接口获取 rawTx
      utxo.rawTx = chain === 'doge' 
        ? await fetchDogeTxHex(utxo.txId)
        : await fetchBtcTxHex(utxo.txId)
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
    source: 'mrc20-v2',
  })

  const mrc20Assets = list.map((data) => ({
    symbol: data.tick,
    tokenName: data.tick,
    isNative: false,
    chain: 'btc',
    queryable: true,
    decimal: Number(data.decimals),
    balance: {
      confirmed: new Decimal(data.balance).mul(10 ** Number(data.decimals)),
      unconfirmed: new Decimal(data.unsafeBalance).mul(10 ** Number(data.decimals)),
      total: new Decimal(data.balance).add(data.unsafeBalance).mul(10 ** Number(data.decimals)),
      pendingIn: new Decimal(data.pendingInBalance || '0').mul(10 ** Number(data.decimals)),
      pendingOut: new Decimal(data.pendingOutBalance || '0').mul(10 ** Number(data.decimals)),
    },
    mrc20Id: data.mrc20Id,
    contract: CoinCategory.MRC20,
    icon:
      data?.metaData && JSON.parse(data.metaData).icon
        ? JSON.parse(data.metaData).icon.replace(
            'metafile://',
            `https://man${network.value === 'testnet' ? '-test' : ''}.metaid.io/content/`
          )
        : data.tag === 'id-coins'
          ? data?.deployUserInfo
            ? data.deployUserInfo.avatar
            : undefined
          : undefined,
  })) as MRC20Asset[]

  cursor += size

  return {
    list: mrc20Assets,
    nextCursor: cursor >= total ? null : cursor,
  }
}

export async function fetchMRC20Detail(address: string, tickId: string): Promise<MRC20Asset | null> {
  const net = getNet()

  const data = await metaletApiV3<MRC20Info>('/mrc20/address/balance-info').get({
    net,
    address,
    tickId,
    source: 'mrc20-v2',
  })

  if (!data) {
    return null
  }

  return {
    symbol: data.tick,
    tokenName: data.tick,
    isNative: false,
    chain: 'btc',
    queryable: true,
    decimal: Number(data.decimals),
    balance: {
      confirmed: new Decimal(data.balance).mul(10 ** Number(data.decimals)),
      unconfirmed: new Decimal(data.unsafeBalance).mul(10 ** Number(data.decimals)),
      total: new Decimal(data.balance).add(data.unsafeBalance).mul(10 ** Number(data.decimals)),
      pendingIn: new Decimal(data.pendingInBalance || '0').mul(10 ** Number(data.decimals)),
      pendingOut: new Decimal(data.pendingOutBalance || '0').mul(10 ** Number(data.decimals)),
    },
    mrc20Id: data.mrc20Id,
    deployAddress: data.deployAddress,
    deployName: data.deployUserInfo?.name,
    deployAvatar: data.deployUserInfo?.avatar,
    contract: CoinCategory.MRC20,
    icon:
      data?.metaData && JSON.parse(data.metaData).icon
        ? JSON.parse(data.metaData).icon.replace(
            'metafile://',
            `https://man${network.value === 'testnet' ? '-test' : ''}.metaid.io/content/`
          )
        : data.tag === 'id-coins'
          ? data?.deployUserInfo
            ? data.deployUserInfo.avatar
            : undefined
          : undefined,
  } as MRC20Asset
}

export async function fetchShovelMetaIdPinUtxos(
  address: string,
  tickId: string,
  needRawTx = false,
  cursor = 0,
  size = 10000
): Promise<MetaIdPinUTXO[]> {
  const net = getNet()

  const { list } = await metaletApiV3<PageResult<ShovelMetaIdPin>>('/mrc20/address/shovel').get({
    net,
    tickId,
    address,
    size: size.toString(),
    cursor: cursor.toString(),
  })

  const utxos = list.map((item) => {
    const [txId, outputIndex] = item.location.split(':')
    return {
      txId,
      id: item.id,
      chain: 'btc',
      pop: item.pop,
      confirmed: true,
      popLv: item.popLv,
      content: item.content,
      satoshis: item.outputValue,
      contentType: item.contentType,
      outputIndex: Number(outputIndex),
      contentSummary: item.contentSummary,
      contentTypeDetect: item.contentTypeDetect,
    } as MetaIdPinUTXO
  })

  if (needRawTx) {
    for (let utxo of utxos) {
      utxo.rawTx = await fetchBtcTxHex(utxo.txId)
    }
  }

  return utxos
}

export const useShovelMetaIdPinUtxosQuery = (
  address: Ref<string>,
  mrc20Id: Ref<string>,
  needRawTx: Ref<boolean>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['ShovelMetaIdPinUtxos', { address, mrc20Id }],
    queryFn: () => fetchShovelMetaIdPinUtxos(address.value, mrc20Id.value, needRawTx.value),
    refetchInterval: COMMON_INTERVAL,
    ...options,
  })
}

export const useMRC20DetailQuery = (
  address: Ref<string>,
  mrc20Id: Ref<string>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['MRC20Detail', { address, mrc20Id }],
    queryFn: () => fetchMRC20Detail(address.value, mrc20Id.value),
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
