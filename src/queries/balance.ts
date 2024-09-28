import Decimal from 'decimal.js'
import { getBtcUtxos } from './utxos'
import { ComputedRef, Ref } from 'vue'
import { getNet } from '@/lib/network'
import { useQuery } from '@tanstack/vue-query'
import { SymbolTicker } from '@/lib/asset-symbol'
import { Balance_QUERY_INTERVAL } from './constants'
import { metaletApiV3, metaletApiV4 } from './request'
import { Balance, BTCBalance, MVCBalance } from './types/balance'

export const fetchSpaceBalance = async (address: string): Promise<Balance> => {
  const net = getNet()
  const balance = await metaletApiV4<MVCBalance>('/mvc/address/balance-info').get({ net, address })
  return {
    confirmed: new Decimal(balance.confirmed),
    unconfirmed: new Decimal(balance.unconfirmed),
    total: new Decimal(balance.confirmed).add(balance.unconfirmed),
  }
}

export const fetchBtcBalance = async (address: string): Promise<Balance> => {
  const net = getNet()
  const data = await metaletApiV3<BTCBalance>(`/address/btc-balance`).get({ net, address })

  return {
    total: new Decimal(data.balance || 0).mul(1e8),
    confirmed: new Decimal(data.safeBalance || 0).mul(1e8),
    unconfirmed: new Decimal(data.pendingBalance || 0).mul(1e8),
  }
}

export const doNothing = async (): Promise<Balance> => {
  return {
    total: new Decimal(0),
    confirmed: new Decimal(0),
    unconfirmed: new Decimal(0),
  }
}

export const useBalanceQuery = (
  address: Ref<string>,
  symbol: Ref<SymbolTicker>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['balance', { address, symbol }],
    queryFn: () => {
      switch (symbol.value) {
        case 'SPACE':
          return fetchSpaceBalance(address.value)
        case 'BTC':
          return fetchBtcBalance(address.value)
        default: {
          return doNothing()
        }
      }
    },
    refetchInterval: Balance_QUERY_INTERVAL,
    ...options,
  })
}

export const useBTCBalanceQuery = (
  address: Ref<string>,
  options?: {
    needRawTx?: boolean
    useUnconfirmed?: boolean
    enabled: ComputedRef<boolean>
  }
) => {
  return useQuery({
    queryKey: ['BTC Balance', { address }],
    queryFn: () => {
      return getBtcUtxos(
        address.value,
        options?.needRawTx === undefined ? false : options?.needRawTx,
        options?.useUnconfirmed === undefined ? true : options?.useUnconfirmed
      )
    },
    select: (utxos) => {
      const balance = utxos.reduce((acc, utxo) => acc.add(utxo.satoshis), new Decimal(0))
      return {
        total: balance,
        confirmed: balance,
        unconfirmed: new Decimal(0),
      }
    },
    refetchInterval: Balance_QUERY_INTERVAL,
    ...options,
  })
}
