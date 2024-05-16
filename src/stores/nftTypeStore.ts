import { Chain } from '@metalet/utxo-wallet-service'
import { reactive } from 'vue'

interface NFTType {
  id: number
  name: string
  disabled: boolean
  chain: Chain
}

const nfts: NFTType[] = [
  { id: 1, name: 'Ordinals', disabled: false, chain: Chain.BTC },
  // { id: 2, name: 'Atomicals', disabled: true },
  { id: 3, name: 'MetaContract', disabled: false, chain: Chain.MVC },
  { id: 4, name: 'MetaID Pin', disabled: false, chain: Chain.BTC },
]

interface NftStore {
  nfts: NFTType[]
  selectedNFT: NFTType
}

export const nftStore = reactive<NftStore>({
  nfts,
  selectedNFT: nfts[0],
})
