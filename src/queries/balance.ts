import Decimal from 'decimal.js'
import { ComputedRef, Ref } from 'vue'
import { getNet } from '@/lib/network'
import { useQuery } from '@tanstack/vue-query'
import { UNISAT_ENABLED } from '@/data/config'
import { SymbolTicker } from '@/lib/asset-symbol'
import { Balance_QUERY_INTERVAL } from './constants'
import { metaletApiV3, mvcApi, unisatApi } from './request'
import { Balance, BitcoinBalance, BTCBalance } from './types/balance'
import { getBtcUtxos } from './utxos'

export const fetchSpaceBalance = async (address: string): Promise<Balance> => {
  const balance = await mvcApi<Omit<Balance, 'total'>>(`/address/${address}/balance`).get()
  return {
    confirmed: new Decimal(balance.confirmed),
    unconfirmed: new Decimal(balance.unconfirmed),
    total: new Decimal(balance.confirmed).add(balance.unconfirmed),
  }
}

export const fetchBtcBalance = async (address: string): Promise<Balance> => {
  const net = getNet()
  if (UNISAT_ENABLED) {
    const data = await unisatApi<BitcoinBalance>(`/address/balance`).get({ net, address })
    return {
      total: new Decimal(data.amount).mul(1e8),
      confirmed: new Decimal(data.confirm_amount).mul(1e8),
      unconfirmed: new Decimal(data.pending_amount).mul(1e8),
    }
  }
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
