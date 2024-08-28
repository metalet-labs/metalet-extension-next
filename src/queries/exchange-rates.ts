import { ComputedRef, Ref } from 'vue'
import { getNet } from '@/lib/network'
import { metaletApiV3 } from './request'
import { useQuery } from '@tanstack/vue-query'
import { SymbolTicker, DEFAULT_SYMBOLS } from '@/lib/asset-symbol'

type RawRates = Record<string, number | undefined>

export const fetchExchangeRates = async (): Promise<RawRates> => {
  const net = getNet()
  return await metaletApiV3<{ priceInfo: RawRates }>(`/coin/price`)
    .get({ net })
    .then((res) => res.priceInfo)
}

export const fetchMRC20ExchangeRates = async (): Promise<RawRates> => {
  const net = getNet()
  return await metaletApiV3<{ priceInfo: RawRates }>(`/coin/mrc20/price`)
    .get({ net })
    .then((res) => res.priceInfo)
}

export const fetchBRC20ExchangeRates = async (): Promise<RawRates> => {
  const net = getNet()
  return await metaletApiV3<{ priceInfo: RawRates }>(`/coin/brc20/price`)
    .get({ net })
    .then((res) => res.priceInfo)
}

export const fetchFTExchangeRates = async (): Promise<RawRates> => {
  return await metaletApiV3<{ priceInfo: RawRates }>(`/coin/contract/ft/price`)
    .get()
    .then((res) => res.priceInfo)
}

export const doNothing = async (symbol: SymbolTicker): Promise<RawRates> => ({
  [symbol]: 0,
  [symbol.toLowerCase()]: 0,
})

export enum CoinCategory {
  Native = 'Native',
  BRC20 = 'BRC-20',
  MetaContract = 'MetaContract',
  Runes = 'Runes',
  MRC20 = 'MRC-20',
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
      if (['testnet', 'regtest'].includes(net) && coinType.value !== CoinCategory.MRC20) {
        return doNothing(symbol.value)
      }
      if (coinType.value === CoinCategory.BRC20) {
        return fetchBRC20ExchangeRates()
      } else if (coinType.value === CoinCategory.MRC20) {
        return fetchMRC20ExchangeRates()
      } else if (coinType.value === CoinCategory.MetaContract) {
        return fetchFTExchangeRates()
      } else if (coinType.value === CoinCategory.Native) {
        return fetchExchangeRates()
      }
      return doNothing(symbol.value)
    },
    select: (rates: RawRates) => {
      const rate =
        rates[
          [CoinCategory.MetaContract, CoinCategory.MRC20].includes(coinType.value)
            ? symbol.value
            : symbol.value.toLowerCase()
        ]
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
      if (net === 'testnet' && coinType.value !== CoinCategory.MRC20) {
        return {}
      }
      if (coinType.value === CoinCategory.BRC20) {
        return fetchBRC20ExchangeRates()
      } else if (coinType.value === CoinCategory.MRC20) {
        return fetchMRC20ExchangeRates()
      } else if (coinType.value === CoinCategory.MetaContract) {
        return fetchFTExchangeRates()
      } else if (coinType.value === CoinCategory.Native) {
        return fetchExchangeRates()
      }
      return {}
    },
    ...options,
  })
}
