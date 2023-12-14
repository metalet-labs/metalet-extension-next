import { Ref, ComputedRef } from 'vue'
import { getNetwork } from '@/lib/network'
import { useQuery } from '@tanstack/vue-query'
import { metaletApiV3, unisatApi } from './request'

export interface PreInscribe {
  count: number
  fee: number
  inscriptionState: number
  minerFee: number
  needAmount: number
  networkFeeRate: number
  orderId: string
  payAddress: string
  payAmount: number
  receiveAddress: string
  serviceFee: number
}

export const preInscribe = async (receiveAddress: string, feeRate: number, filename: string): Promise<PreInscribe> => {
  const network = await getNetwork()
  const net = network === 'mainnet' ? 'livenet' : network
  return await metaletApiV3<PreInscribe>(`/inscribe/pre`).post({
    feeRate,
    files: [
      {
        filename,
        dataURL: Buffer.from(filename).toString('base64'),
      },
    ],
    net,
    receiveAddress,
  })
}

export interface CommitInscribe {
  commitTxHash: string
  inscriptionIdList: string[]
  inscriptionState: number
  orderId: string
  revealTxHashList: string[]
}

export const commitInscribe = async (
  address: string,
  orderId: string,
  rawTx: string
): Promise<CommitInscribe | void> => {
  const network = await getNetwork()
  const net = network === 'mainnet' ? 'livenet' : network
  return await metaletApiV3<CommitInscribe>(`/inscribe/commit`).post({
    feeAddress: address,
    net,
    orderId,
    rawTx,
    version: 0,
  })
}

export const getInscribeInfo = async (orderId: string): Promise<CommitInscribe> => {
  return await metaletApiV3<CommitInscribe>(`/inscribe/info`).post({
    orderId,
  })
}

export interface Inscription {
  inscriptionId: string
  inscriptionNumber: number
  address: string
  outputValue: number
  preview: string
  content: string
  contentType: string
  contentLength: number
  timestamp: number
  genesisTransaction: string
  location: string
  output: string
  offset: number
  contentBody: string
  utxoHeight: number
  utxoConfirmation: number
}

export async function getBRCInscriptions(
  address: string,
  cursor = 0,
  size = 10
): Promise<{ list: Inscription[]; total: number }> {
  return await unisatApi<{ list: Inscription[]; total: number }>('/address/inscriptions').get({ address, cursor, size })
}

export const useBRCInscriptionsQuery = (
  address: Ref<string>,
  cursor: Ref<number>,
  size: Ref<number>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['BRCInscriptions', { address: address.value, cursor: cursor.value, size: size.value }],
    queryFn: () => getBRCInscriptions(address.value, cursor.value, size.value),
    ...options,
  })
}