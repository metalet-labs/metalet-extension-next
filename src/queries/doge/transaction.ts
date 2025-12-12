/**
 * DOGE Transaction Query Functions
 */

import { Ref, ComputedRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getNet } from '@/lib/network'
import { metaletApiV4 } from '@/queries/request'

export interface DogeTxItem {
  txid: string
  address: string
  income: number
  outcome: number
  height: number
  time: number
  flag?: string
}

export interface DogeTxListResponse {
  list: DogeTxItem[]
  total: number
}

export interface DogeFeeRate {
  title: string
  desc: string
  feeRate: number
}

/**
 * Broadcast DOGE transaction
 * Uses the /v4/doge/tx/broadcast endpoint
 */
export async function broadcastDogeTx(rawTx: string): Promise<string> {
  const net = getNet()
  
  const data = await metaletApiV4<{ TxId: string }>('/doge/tx/broadcast', {
    withCredential: false,
  }).post({
    net,
    rawTx,
  })

  return data.TxId
}

/**
 * Fetch DOGE transaction list for an address
 * Uses the /v4/doge/address/tx-list endpoint
 */
export async function fetchDogeTxList(
  address: string,
  options?: {
    size?: number
    flag?: string
    confirmed?: boolean
  }
): Promise<DogeTxListResponse> {
  const net = getNet()
  
  return metaletApiV4<DogeTxListResponse>('/doge/address/tx-list', {
    withCredential: false,
  }).get({
    net,
    address,
    size: options?.size,
    flag: options?.flag,
    confirmed: options?.confirmed,
  })
}

/**
 * Get DOGE transaction count for an address
 */
export async function fetchDogeTxCount(address: string): Promise<number> {
  const net = getNet()
  
  const data = await metaletApiV4<{ txCount: number }>('/doge/address/tx-count', {
    withCredential: false,
  }).get({
    net,
    address,
  })

  return data.txCount
}

/**
 * Get default DOGE fee rate
 * DOGE minimum recommended fee is 0.01 DOGE/KB = 1,000,000 sat/KB
 * (1 DOGE = 100,000,000 satoshis)
 */
export function getDogeFeeRates(): DogeFeeRate[] {
  return [
    {
      title: 'Slow',
      desc: '~60 minutes',
      feeRate: 1000000, // 0.01 DOGE/KB
    },
    {
      title: 'Avg',
      desc: '~30 minutes', 
      feeRate: 2000000, // 0.02 DOGE/KB
    },
    {
      title: 'Fast',
      desc: '~10 minutes',
      feeRate: 5000000, // 0.05 DOGE/KB
    },
  ]
}

/**
 * Vue Query hook for DOGE transaction list
 */
export const useDogeTxListQuery = (
  address: Ref<string>,
  options?: {
    size?: number
    enabled?: ComputedRef<boolean>
  }
) => {
  return useQuery({
    queryKey: ['DOGE TxList', { address }],
    queryFn: () => fetchDogeTxList(address.value, { size: options?.size }),
    ...options,
  })
}
