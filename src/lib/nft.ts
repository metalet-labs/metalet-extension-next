import { Chain } from '@metalet/utxo-wallet-service'
import nftGenesiss from '../data/nfts'
import useStorage from './storage'

export type NFTType = 'Ordinals' | 'MetaContract' | 'MetaID PIN'

const NFTType_Key = 'NFTTabType'

const storage = useStorage()

export const nfts = [
  { id: 1, name: 'Ordinals', disabled: false, chain: Chain.BTC },
  // { id: 2, name: 'Atomicals', disabled: true },
  { id: 3, name: 'MetaContract', disabled: false, chain: Chain.MVC },
  { id: 4, name: 'MetaID PIN', disabled: false, chain: Chain.BTC },
]

export function isOfficialNft(genesis: string) {
  return nftGenesiss.some((nftGenesis) => nftGenesis.genesis === genesis)
}

export function getNftType() {
  return storage.get<NFTType>(NFTType_Key, { defaultValue: 'MetaContract' })
}

export function setNftType(nftType: NFTType) {
  return storage.set(NFTType_Key, nftType)
}
