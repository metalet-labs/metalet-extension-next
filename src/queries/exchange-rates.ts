import { ComputedRef, Ref } from 'vue'
import { getNet } from '@/lib/network'
import { metaletApiV3 } from './request'
import { useQuery } from '@tanstack/vue-query'
import { SymbolTicker, DEFAULT_SYMBOLS } from '@/lib/asset-symbol'

type RawRates = Record<string, number | undefined>

export const fetchExchangeRates = async (): Promise<RawRates> => {
  return await metaletApiV3<{ priceInfo: RawRates }>(`/coin/price`)
    .get()
    .then((res) => res.priceInfo)
}

export const fetchTickExchangeRates = async (): Promise<RawRates> => {
  return await metaletApiV3<{ priceInfo: RawRates }>(`/coin/brc20/price`)
    .get()
    .then((res) => res.priceInfo)
}

export const fetchFTExchangeRates = async (): Promise<RawRates> => {
  return await metaletApiV3<{ priceInfo: RawRates }>(`/coin/contract/ft/price`)
    .get()
    .then((res) => res.priceInfo)
}

export const doNothing = async (symbol: SymbolTicker): Promise<RawRates> => ({
  symbol: 0,
  [symbol.toLowerCase()]: 0,
})

export enum CoinCategory {
  Native = 'Native',
  BRC20 = 'BRC-20',
  MetaContract = 'MetaContract',
}

export const getExchangeCoinType = (symbol: SymbolTicker, contract?: string): CoinCategory => {
  if (DEFAULT_SYMBOLS.includes(symbol)) {
    return CoinCategory.Native
  } else if (contract === 'BRC-20') {
    return CoinCategory.BRC20
  } else if (contract === 'MetaContract') {
    return CoinCategory.MetaContract
  } else {
    throw Error('Unknown coin category')
  }
}

export const useExchangeRatesQuery = (
  symbol: Ref<SymbolTicker>,
  coinType: Ref<CoinCategory> | ComputedRef<CoinCategory>,
  options?: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['exchangeRates', { coinType }],
    queryFn: async () => {
      const net = getNet()
      if (net === 'testnet') {
        return doNothing(symbol.value)
      }
      if (coinType.value === 'BRC-20') {
        return fetchTickExchangeRates()
      } else if (coinType.value === 'MetaContract') {
        return fetchFTExchangeRates()
      } else if (coinType.value === 'Native') {
        return fetchExchangeRates()
      }
      return doNothing(symbol.value)
    },
    select: (rates: RawRates) => {
      const rate = rates[coinType.value === 'MetaContract' ? symbol.value : symbol.value.toLowerCase()]
      return { symbol: symbol.value, price: rate }
    },
    ...options,
  })
}

export const useAllExchangeRatesQuery = (
  coinType: Ref<CoinCategory> | ComputedRef<CoinCategory>,
  options?: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['exchangeRates', { coinType }],
    queryFn: async () => {
      const net = getNet()
      if (net === 'testnet') {
        return {}
      }
      if (coinType.value === 'BRC-20') {
        return fetchTickExchangeRates()
      } else if (coinType.value === 'MetaContract') {
        return fetchFTExchangeRates()
      } else if (coinType.value === 'Native') {
        return fetchExchangeRates()
      }
      return {}
    },
    ...options,
  })
}
