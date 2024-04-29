import Decimal from 'decimal.js'
import { ComputedRef, Ref } from 'vue'
import { getNet } from '@/lib/network'
import { useQuery } from '@tanstack/vue-query'
import { UNISAT_ENABLED } from '@/data/config'
import { SymbolTicker } from '@/lib/asset-symbol'
import { Balance_QUERY_INTERVAL } from './constants'
import { metaletApiV3, mvcApi, unisatApi } from './request'
import { Balance, BitcoinBalance, BTCBalance } from './types/balance'

export const fetchSpaceBalance = async (address: string): Promise<Balance> => {
  const balance = await mvcApi<Omit<Balance, 'total'>>(`/address/${address}/balance`).get()
  return {
    confirmed: balance.confirmed,
    unconfirmed: balance.unconfirmed,
    total: new Decimal(balance.confirmed).add(balance.unconfirmed).toNumber(),
  }
}

export const fetchBtcBalance = async (address: string): Promise<Balance> => {
  const net = getNet()
  if (UNISAT_ENABLED) {
    const data = await unisatApi<BitcoinBalance>(`/address/balance`).get({ net, address })
    return {
      total: new Decimal(data.amount).mul(1e8).toNumber(),
      confirmed: new Decimal(data.confirm_amount).mul(1e8).toNumber(),
      unconfirmed: new Decimal(data.pending_amount).mul(1e8).toNumber(),
    }
  }
  const data = await metaletApiV3<BTCBalance>(`/address/btc-balance`).get({ net, address })
  return {
    total: new Decimal(data.balance).mul(1e8).toNumber(),
    confirmed: new Decimal(data.block.incomeFee).mul(1e8).toNumber(),
    unconfirmed: new Decimal(data.mempool.incomeFee).mul(1e8).toNumber(),
  }
}

export const doNothing = async (address: string): Promise<Balance> => {
  return {
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
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
          return doNothing(address.value)
        }
      }
    },
    refetchInterval: Balance_QUERY_INTERVAL,
    ...options,
  })
}
