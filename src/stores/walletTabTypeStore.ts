import { reactive } from 'vue'
import { Chain } from '@metalet/utxo-wallet-service'

interface TabType {
  id: number
  name: string
  nameKey?: string
  chain?: Chain
  isNew: boolean
  disabled: boolean
}

const tabs: TabType[] = [
  {
    id: 1,
    name: 'Crypto',
    nameKey: 'HomePage.Crypto',
    disabled: false,
    isNew: false,
  },
  { id: 2, name: 'NFTs', disabled: false, isNew: false },
  { id: 3, name: 'Runes', disabled: true, isNew: false, chain: Chain.BTC },
  { id: 4, name: 'MRC20', disabled: false, isNew: false, chain: Chain.BTC },
  { id: 5, name: 'MetaID PIN', disabled: true, isNew: false, chain: Chain.BTC },
  { id: 6, name: 'MRC721', disabled: false, isNew: true },
]

interface WalletStore {
  tabs: TabType[]
  selectedTab: TabType
}

export const walletTabStore = reactive<WalletStore>({
  tabs,
  selectedTab: tabs[0],
})
