import Decimal from 'decimal.js'
import { PageResult } from './types'
import { getNet } from '@/lib/network'
import { ComputedRef, Ref } from 'vue'
import { Balance } from './types/balance'
import { useQuery } from '@tanstack/vue-query'
import { SymbolTicker } from '@/lib/asset-symbol'
import { Balance_QUERY_INTERVAL } from './constants'
import type { MetaContractAsset } from '@/data/assets'
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

export const fetchMVCTokens = async (address: string, codehash?: string, genesis?: string): Promise<Token[]> => {
  const net = getNet()
  const { list: tokens } = await metaletApiV4<PageResult<Token>>(`/mvc/address/contract/ft/balance-list`, {
    withCredential: false,
  }).get({
    net,
    address,
    genesis,
    codehash,
  })
  return tokens
}

export const useMetaContractAssetsQuery = (
  address: Ref<string>,
  options: {
    genesis?: Ref<string>
    codehash?: Ref<string>
    enabled: ComputedRef<boolean>
    autoRefresh?: ComputedRef<boolean>
  }
) => {
  return useQuery({
    queryKey: ['MetaContractAssets', { address, codehash: options.codehash, genesis: options.genesis }],
    queryFn: () => fetchMVCTokens(address.value, options?.codehash?.value, options?.genesis?.value),
    select: (tokens: Token[]) =>
      tokens.map(
        (token) =>
          ({
            chain: 'mvc',
            isNative: false,
            queryable: true,
            symbol: token.symbol,
            decimal: token.decimal,
            genesis: token.genesis,
            tokenName: token.symbol,
            contract: 'MetaContract',
            codeHash: token.codeHash,
            sensibleId: token.sensibleId,
            icon: 'https://www.metalet.space/wallet-api' + token.icon,
            balance: {
              confirmed: new Decimal(token.confirmedString),
              unconfirmed: new Decimal(token.unconfirmedString),
              total: new Decimal(token.confirmedString).add(token.unconfirmedString),
            },
          }) as MetaContractAsset
      ),
    refetchInterval: options.autoRefresh ? Balance_QUERY_INTERVAL : undefined,
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

export async function getMetaContractOfficialToken(): Promise<string[]> {
  return (
    (await metaletApiV3<{ ftContractOfficialList: string[] }>('/coin/official').get())?.ftContractOfficialList || []
  )
}
