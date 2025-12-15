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

export interface DogeFeeRateResponse {
  list: DogeFeeRate[]
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
 * Fetch DOGE fee rates from API
 * Uses the /v4/doge/fee/summary endpoint
 */
export async function fetchDogeFeeRates(): Promise<DogeFeeRate[]> {
  const net = getNet()
  
  const data = await metaletApiV4<DogeFeeRateResponse>('/doge/fee/summary', {
    withCredential: false,
  }).get({
    net,
  })

  return data.list
}

/**
 * Get default DOGE fee rates (fallback)
 * DOGE minimum recommended fee is 0.01 DOGE/KB = 1,000,000 sat/KB
 * (1 DOGE = 100,000,000 satoshis)
 */
export function getDefaultDogeFeeRates(): DogeFeeRate[] {
  return [
    {
      title: 'Fast',
      desc: 'About 10 minutes',
      feeRate: 200000,
    },
    {
      title: 'Avg',
      desc: 'About 30 minutes', 
      feeRate: 250000,
    },
    {
      title: 'Slow',
      desc: 'About 1 hours',
      feeRate: 300000,
    },
  ]
}

/**
 * Vue Query hook for DOGE fee rates
 */
export const useDogeFeeRatesQuery = (options?: {
  enabled?: ComputedRef<boolean>
}) => {
  return useQuery({
    queryKey: ['DOGE FeeRates'],
    queryFn: fetchDogeFeeRates,
    staleTime: 60 * 1000, // Cache for 1 minute
    ...options,
  })
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
