import { ComputedRef } from 'vue'
import { PageResult } from './types'
import { getNet } from '@/lib/network'
import { metaletApiV3, metaletApiV4 } from './request'
import { useQuery } from '@tanstack/vue-query'
import { Chain } from '@metalet/utxo-wallet-service'
import { FEEB } from '@/data/config'

export const fetchBtcTxHex = async (
  txId: string,
  option?: {
    withCredential: boolean
  }
): Promise<string> => {
  const net = getNet()
  return metaletApiV3<{ rawTx: string }>(`/tx/raw`, option)
    .get({ net, txId, chain: 'btc' })
    .then((res) => res.rawTx)
}

export const fetchMvcTxHex = async (
  txId: string,
  option?: {
    withCredential: boolean
  }
): Promise<string> => {
  const net = getNet()
  return metaletApiV4<{ hex: string }>(`/mvc/tx/raw`, option)
    .get({ net, txId })
    .then((res) => res.hex)
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

export const getMVCTRate = async (): Promise<PageResult<FeeRate>> => {
  const net = getNet()
  return metaletApiV4<PageResult<FeeRate>>(`/mvc/fee/summary`, {
    withCredential: false,
  }).get({ net })
}

export const getDefaultMVCTRate = async (): Promise<number> => {
  try {
    const feeRes = await getMVCTRate()
    if (feeRes.list.length) {
      const fastRate = feeRes.list.find((rate) => rate.title === 'Fast')
      return fastRate ? fastRate.feeRate : FEEB // Return fast rate or default fee
    }
  } catch (error) {
    console.error('Error fetching MVC fee rate:', error)
  }
  return FEEB // Default fee rate in case of error
}

export const useMVCRateQuery = (options?: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['MVCTRate'],
    queryFn: () => getMVCTRate(),
    select: (result) => {
      if (result.list.length && result.list[0].title === 'Fast') {
        return result.list.reverse()
      }
      return result.list
    },
    ...options,
  })
}
