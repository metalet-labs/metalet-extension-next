import type { InjectionKey, Ref } from 'vue'

export const idcoinDetailKey = Symbol('idcoinDetail key') as InjectionKey<Ref<Idcoin | undefined>>

export type Idcoin = {
  amtPerMint: string
  blockHeight: string
  decimals: string
  deployTime: number
  deployerAddress: string
  deployerMetaId: string
  deployerUserInfo: {
    avatar: string
    name: string
  }
  followersLimit: string
  holders: number
  isFollowing: boolean
  liquidityPerMint: number
  metaData: string
  mintCount: string
  mintable: boolean
  mrc20Id: string
  payCheck: string
  pinCheck: string
  pinNumber: number
  pool: number
  premineCount: string
  price: string
  priceUsd: string
  qual: string
  remaining: string
  supply: string
  tick: string
  tickId: string
  tokenName: string
  totalMinted: string
  totalSupply: string
  type: string
}
