import { getNet } from '@/lib/network'
import { ComputedRef, Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { metaletApiV3 } from './request'

export type NftCollection = {
  codehash: string
  genesis: string
  metaTxid: string
  metaOutputIndex: number
  tokenSupply: string
  count: number
}

export type Nft = {
  address: string
  txid: string
  txIndex: number
  codehash: string
  genesis: string
  metaTxid: string
  metaOutputIndex: number
  tokenSupply: number
  tokenIndex: number
  flag: string
}

export interface MetaIDPin {
  id: string
  number: number
  rootTxId: string
  address: string
  output: string
  outputValue: number
  timestamp: number
  genesisFee: number
  genesisHeight: number
  genesisTransaction: string
  txInIndex: number
  txInOffset: number
  operation: string
  path: string
  parentPath: string
  encryption: string
  version: string
  preview: string
  content: string
  contentType: string
  contentBody: string
  contentLength: number
  contentSummary: string
}

export async function getMetaPins(address: string, cursor = 0, size = 10): Promise<MetaIDPin[]> {
  const net = getNet()
  return await metaletApiV3<MetaIDPin[]>('/address/pins').get({
    net,
    address,
    cursor: `${cursor}`,
    size: `${size}`,
  })
}

export async function getMetaPin(pinId: string): Promise<MetaIDPin> {
  const net = getNet()
  return await metaletApiV3<MetaIDPin>('/pin/utxo').get({
    net,
    pinId,
  })
}

export const useMetaPinQuery = (pinId: Ref<string>, options: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['MetaID PIN', { pinId }],
    queryFn: () => getMetaPin(pinId.value),
    ...options,
  })
}
export const useMetaPinsQuery = (
  address: Ref<string>,
  cursor: Ref<number>,
  size: Ref<number>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['MetaPins', { address: address.value, cursor: cursor.value, size: size.value }],
    queryFn: () => getMetaPins(address.value, cursor.value, size.value),
    ...options,
  })
}

interface MetaContract {
  address: string
  txId: string
  codeHash: string
  genesis: string
  sensibleId: string
  height: number
  metaTxId: string
  metaOutputIndex: number
  issuerAddress: string
  issueTime: number
  tokenSupply: number
  tokenIndex: number
  satoshi: number
  satoshiString: string
  flag: string
  name: string
  icon: string
  seriesName: string
}

type ListResult<T> = {
  list: T[]
}

export const fetchMetacontracts = async (
  address: string,
  codehash?: string,
  genesis?: string,
  size?: string,
  flag?: string
): Promise<ListResult<MetaContract>> => {
  const net = getNet()
  return await metaletApiV3<ListResult<MetaContract>>('/address/contract/nft/utxo').get({
    net,
    address,
    codehash,
    genesis,
    size,
    flag,
  })
}

export const fetchMetacontractCount = async (address: string): Promise<{ count: number }> => {
  const net = getNet()
  return await metaletApiV3<{ count: number }>('/address/contract/nft/count').get({
    net,
    address,
  })
}

export const useMetacontractCountQuery = (address: Ref<string>, options: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['MetacontractCount', { address }],
    queryFn: () => fetchMetacontractCount(address.value),
    select: (data) => data.count,
    ...options,
  })
}

export const useMetacontractsQuery = (
  {
    address,
    codehash,
    genesis,
    size,
    flag,
  }: {
    address: Ref<string>
    codehash?: Ref<string>
    genesis?: Ref<string>
    size?: Ref<string>
    flag?: Ref<string>
  },
  options?: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['Metacontracts', { address, size, flag }],
    queryFn: () => fetchMetacontracts(address.value, codehash?.value, genesis?.value, size?.value || '10', flag?.value),
    select: (data) => {
      return data.list.map((metaContract) => ({
        id: metaContract.txId,
        name: metaContract.name,
        issuerAddress: metaContract.issuerAddress,
        issueTime: metaContract.issueTime,
        seriesName: metaContract.seriesName,
        codehash: metaContract.codeHash,
        genesis: metaContract.genesis,
        tokenIndex: metaContract.tokenIndex,
        metaTxId: metaContract.metaTxId,
        metaOutputIndex: metaContract.metaOutputIndex,
        imgUrl: metaContract.icon
          ? `https://metalet.space/metafile/compress/${metaContract.icon.match(/metafile:\/\/(.*?)(?:\..*)?$/)?.[1] || ''}`
          : '',
      }))
    },
    ...options,
  })
}
