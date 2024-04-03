import { ScriptType } from 'utxo-wallet-sdk'
import { mvcCoinType } from 'utxo-wallet-service'

export interface V1Account {
  id: string
  name?: string
  mnemonic: string
  path: string // mvc coin type
  assetsDisplay?: string[]
  btcPath?: string // btc hd full path
  btcType?: ScriptType
}

export type Chain = 'btc' | 'mvc'

export interface DerivedAccountDetail {
  path: string
  addressType: ScriptType
  mainnetAddress: string
  testnetAddress: string
  credential?: {
    address: string
    publicKey: string
    signature: string
  }
}

export interface V2Account {
  id: string
  name: string
  mnemonic: string
  assetsDisplay: string[]
  mvc: DerivedAccountDetail
  btc: DerivedAccountDetail
}

export type ChainDetail = {
  [chain in Chain]: Omit<DerivedAccountDetail, 'credential'>
}

export interface V3Wallet {
  id: string
  name: string
  mnemonic: string
  mvcTypes: mvcCoinType[]
  accounts: {
    id: string
    name: string
    addressIndex: number
  }[]
}
