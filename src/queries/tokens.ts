import Decimal from 'decimal.js'
import { PageResult } from './types'
import { getNet } from '@/lib/network'
import { ComputedRef, Ref } from 'vue'
import { Balance } from './types/balance'
import type { FTAsset } from '@/data/assets'
import { useQuery } from '@tanstack/vue-query'
import { SymbolTicker } from '@/lib/asset-symbol'
import { Balance_QUERY_INTERVAL } from './constants'
import { metaletApiV3, metaletApiV4 } from './request'

export type Token = {
  codeHash: string
  genesis: string
  name: string
  symbol: SymbolTicker
  icon: string
  decimal: number
  sensibleId: string
  utxoCount: number
  confirmed: number
  confirmedString: string
  unconfirmed: number
  unconfirmedString: string
}

export const fetchMVCTokens = async (address: string): Promise<Token[]> => {
  const net = getNet()
  const { list: tokens } = await metaletApiV4<PageResult<Token>>(`/mvc/address/contract/ft/balance-list`).get({
    address,
    net,
  })
  return tokens
}

export const useMVCAssetsQuery = (
  address: Ref<string>,
  options: { enabled: ComputedRef<boolean>; autoRefresh?: boolean }
) => {
  return useQuery({
    queryKey: ['MVCTokens', { address }],
    queryFn: () => fetchMVCTokens(address.value),
    select: (tokens: Token[]) =>
      tokens.map(
        (token) =>
          ({
            chain: 'mvc',
            isNative: false,
            queryable: true,
            icon: 'https://www.metalet.space/wallet-api' + token.icon,
            symbol: token.symbol,
            decimal: token.decimal,
            genesis: token.genesis,
            tokenName: token.symbol,
            contract: 'MetaContract',
            codeHash: token.codeHash,
            balance: {
              confirmed: new Decimal(token.confirmedString),
              unconfirmed: new Decimal(token.unconfirmedString),
              total: new Decimal(token.confirmedString).add(token.unconfirmedString),
            },
          }) as FTAsset
      ),
    refetchInterval: options.autoRefresh ? Balance_QUERY_INTERVAL : undefined,
    ...options,
  })
}

export const useMVCTokenQuery = (
  address: Ref<string>,
  genesis: Ref<string>,
  options: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['MVCTokens', { address }],
    queryFn: () => fetchMVCTokens(address.value),
    select: (tokens: Token[]) => {
      const token = tokens.find((token) => token.genesis === genesis.value)
      if (token) {
        return {
          symbol: token.symbol,
          tokenName: token.name,
          isNative: false,
          chain: 'mvc',
          queryable: true,
          decimal: token.decimal,
          contract: 'MetaContract',
          codeHash: token.codeHash,
          genesis: token.genesis,
          balance: {
            confirmed: new Decimal(token.confirmedString),
            unconfirmed: new Decimal(token.unconfirmedString),
            total: new Decimal(token.confirmedString).add(token.unconfirmedString),
          },
        } as FTAsset
      }
    },
    refetchInterval: Balance_QUERY_INTERVAL,
    ...options,
  })
}

export const fetchTokenBalance = async (address: string, genesis: string): Promise<Balance> => {
  const tokens = await fetchMVCTokens(address)

  const token = tokens.find((token) => token.genesis === genesis)
  const confirmed = new Decimal(token?.confirmedString || 0)
  const unconfirmed = new Decimal(token?.unconfirmedString || 0)
  return {
    confirmed,
    unconfirmed,
    total: confirmed.add(unconfirmed),
  }
}

export async function getFtOfficialToken(): Promise<string[]> {
  return (
    (await metaletApiV3<{ ftContractOfficialList: string[] }>('/coin/official').get())?.ftContractOfficialList || []
  )
}
