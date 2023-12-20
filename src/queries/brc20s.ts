import { PageResult } from './types'
import { ComputedRef, Ref } from 'vue'
import { type Asset } from '@/data/assets'
import { useQuery } from '@tanstack/vue-query'
import { SymbolTicker } from '@/lib/asset-symbol'
import { metaletApi, metaletApiV3, metaletApiV2 } from './request'
import { getBRC20Logo } from '@/data/logos'

export type Brc20 = {
  symbol: SymbolTicker
  balance: string
  availableBalance: string
  transferBalance: string
}

type RawBrc20 = {
  token: SymbolTicker
  balance: string
  tokenType: 'BRC20'
  availableBalance: string
  transferBalance: string
}

interface TickerInfo {
  completeBlocktime: number
  completeHeight: number
  confirmedMinted: string
  confirmedMinted1h: string
  confirmedMinted24h: string
  creator: string
  decimal: string
  deployBlocktime: number
  deployHeight: number
  historyCount: number
  holdersCount: number
  inscriptionId: string
  inscriptionNumber: number
  inscriptionNumberEnd: number
  inscriptionNumberStart: number
  limit: string
  max: string
  mintTimes: number
  minted: string
  ticker: string
  totalMinted: number
  txid: string
}

export const getTickerInfo = async (tick: string): Promise<TickerInfo> => {
  return await metaletApiV3<TickerInfo>(`/brc20/tick/info`).get({ tick })
}

interface TokenBalance {
  ticker: string
  overallBalance: string
  transferableBalance: string
  availableBalance: string
  availableBalanceSafe: string
  availableBalanceUnSafe: string
  decimal: number
}

export const fetchBRC20Token = async (address: string): Promise<Asset[]> => {
  return (
    await metaletApiV2<PageResult<TokenBalance>>(`/brc20/tokens`).get({ address, cursor: '0', size: '100000' })
  ).list.map(
    (token) =>
      ({
        symbol: token.ticker,
        logo: getBRC20Logo(token.ticker),
        tokenName: token.ticker,
        isNative: false,
        chain: 'btc',
        queryable: true,
        decimal: 0,
        contract: 'BRC-20',
        balance: {
          total: Number(token.overallBalance),
          availableBalance: Number(token.availableBalance),
          transferBalance: Number(token.transferableBalance),
        },
      }) as Asset
  )
}

export interface TokenInfo {
  totalSupply: string
  totalMinted: string
}

export interface TokenTransfer {
  ticker: string
  amount: string
  inscriptionId: string
  inscriptionNumber: number
  timestamp: number
}

export const fetchBrc20s = async (address: string): Promise<RawBrc20[]> => {
  const tokens: any = await metaletApi(`/address/brc20/asset`)
    .get({ address, chain: 'btc' })
    .then((res) => res.data?.tickList || [])

  return tokens
}

export const useBrc20sQuery = (address: Ref, options: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['brc20s', { address: address.value }],
    queryFn: () => fetchBrc20s(address.value),
    select: (tokens) => {
      return tokens.map((token) => {
        return {
          ...token,
          symbol: token.token,
        }
      })
    },
    ...options,
  })
}
