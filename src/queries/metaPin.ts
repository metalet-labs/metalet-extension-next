import { getNet } from '@/lib/network'
import { Ref, ComputedRef } from 'vue'
import { metaletApiV3 } from './request'
import { fetchBtcTxHex } from '@/queries/transaction'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'

export interface MetaIDPin {
  id: string
  pop: string
  popLv: number
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
  contentTypeDetect: string
  status: number
  rawTx?: string
  metaid: string
  creator: string
  avatar: string
}

export async function fetchMetaPins(
  address: string,
  cursor: number,
  size: number
): Promise<{ metaPins: MetaIDPin[]; nextCursor: number | null }> {
  const net = getNet()
  const metaPins = await metaletApiV3<MetaIDPin[]>('/address/pins').get({
    net,
    address,
    cursor: `${cursor}`,
    size: `${size}`,
  })

  const nextCursor = metaPins.length < size ? null : cursor + size

  return {
    metaPins,
    nextCursor,
  }
}

export const useMetaPinsInfiniteQuery = (
  address: Ref<string>,
  size: Ref<number>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useInfiniteQuery(
    ['MetaPins', { address, size }],
    ({ pageParam: cursor = 0 }) => fetchMetaPins(address.value, cursor, size.value),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      ...options,
    }
  )
}

export async function getMetaPin(pinId: string, needRawTx: boolean = false): Promise<MetaIDPin> {
  const net = getNet()
  const metaIdPin = await metaletApiV3<MetaIDPin>('/pin/utxo').get({
    net,
    pinId,
  })
  if (needRawTx) {
    const txId = metaIdPin.output.split(':')[0]
    metaIdPin.rawTx = await fetchBtcTxHex(txId)
  }
  return metaIdPin
}

export const useMetaPinQuery = (pinId: Ref<string>, options: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['MetaID PIN', { pinId }],
    queryFn: () => getMetaPin(pinId.value),
    ...options,
  })
}
