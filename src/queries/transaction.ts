import { ComputedRef } from 'vue'
import { PageResult } from './types'
import { getNet } from '@/lib/network'
import { metaletApiV3 } from './request'
import { useQuery } from '@tanstack/vue-query'
import { Chain } from '@metalet/utxo-wallet-service'

export const fetchBtcTxHex = async (txId: string): Promise<string> => {
  const net = getNet()
  return metaletApiV3<{ rawTx: string }>(`/tx/raw`)
    .get({ net, txId, chain: 'btc' })
    .then((res) => res.rawTx)
}

export const broadcastBTCTx = async (rawTx: string) => {
  return await broadcastTx(rawTx, Chain.BTC)
}

export const broadcastTx = async (rawTx: string, chain: Chain) => {
  const net = getNet()
  return await metaletApiV3<string>(`/tx/broadcast`).post({ chain, net, rawTx })
}

export interface FeeRate {
  title: string
  desc: string
  feeRate: number
}

export const getBTCTRate = async (): Promise<PageResult<FeeRate>> => {
  const net = getNet()
  return metaletApiV3<PageResult<FeeRate>>(`/btc/fee/summary`).get({ net })
}

export const useBTCRateQuery = (options?: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['BTCTRate'],
    queryFn: () => getBTCTRate(),
    select: (result) => {
      if (result.list.length && result.list[0].title === 'Fast') {
        return result.list.reverse()
      }
      return result.list
    },
    ...options,
  })
}
