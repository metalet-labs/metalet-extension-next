import { ComputedRef, Ref } from 'vue'
import { PageResult } from './types'
import { getNet } from '@/lib/network'
import { metaletApiV3 } from './request'
import { useQuery } from '@tanstack/vue-query'
import { Chain } from '@metalet/utxo-wallet-service'
import { MetaContractAsset } from '@/data/assets'
import Decimal from 'decimal.js'
import { CoinCategory } from './exchange-rates'
import { Protocol } from '@/lib/types/protocol'

interface TokenInfo {
  codeHash: string
  genesis: string
  name: string
  symbol: string
  icon: string
  decimal: number
  sensibleId: string
  utxoCount: string
  confirmed: number
  confirmedString: string
  unconfirmed: number
  unconfirmedString: string
}

export const getMetaContractAssets = async (
  address: string,
  codehash?: string,
  genesis?: string
): Promise<MetaContractAsset[]> => {
  const net = getNet()
  return await metaletApiV3<PageResult<TokenInfo>>(`/address/contract/ft/balance`)
    .get({ net, address, codehash, genesis })
    .then(({ list }) =>
      list.map((item) => ({
        symbol: item.symbol,
        tokenName: item.name,
        isNative: false,
        chain: 'mvc',
        queryable: true,
        decimal: item.decimal,
        balance: {
          total: new Decimal(item.confirmed).add(item.unconfirmed),
          confirmed: new Decimal(item.confirmed),
          unconfirmed: new Decimal(item.unconfirmed),
        },
        codeHash: item.codeHash,
        genesis: item.genesis,
        icon: item.icon,
        sensibleId: item.sensibleId,
        contract: CoinCategory.MetaContract,
        protocol: Protocol.MetaContract,
      }))
    )
}

export const useMetaContractAssetQuery = (
  address: Ref<string>,
  codeHash: Ref<string>,
  genesis: Ref<string>,
  options?: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['MetaContract Asset', address, codeHash, genesis],
    queryFn: () => getMetaContractAssets(address.value, codeHash.value, genesis.value),
    select: (list) => list?.[0],
    ...options,
  })
}

export const useMetaContractListQuery = (
  address: Ref<string>,
  codeHash?: Ref<string>,
  genesis?: Ref<string>,
  options?: { enabled: ComputedRef<boolean> }
) => {
  return useQuery({
    queryKey: ['MetaContract Query', address, codeHash, genesis],
    queryFn: () => getMetaContractAssets(address.value, codeHash!.value, genesis!.value),
    ...options,
  })
}
