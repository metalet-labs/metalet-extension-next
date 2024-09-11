import i18n from '@/i18n'
import { reactive } from 'vue'
import { Chain } from '@metalet/utxo-wallet-service'

interface TabType {
  id: number
  name: string
  chain?: Chain
  isNew: boolean
  disabled: boolean
}

const tabs: TabType[] = [
  { id: 1, name: i18n.global.t('HomePage.Crypto'), disabled: false, isNew: false },
  { id: 2, name: i18n.global.t('HomePage.NFTs'), disabled: false, isNew: false },
  // { id: 3, name: 'Runes', disabled: false, isNew: false, chain: Chain.BTC },
  { id: 4, name: i18n.global.t('HomePage.MRC20'), disabled: false, isNew: true, chain: Chain.BTC },
  { id: 5, name: i18n.global.t('HomePage.MetaIDPIN'), disabled: false, isNew: false, chain: Chain.BTC },
]

interface WalletStore {
  tabs: TabType[]
  selectedTab: TabType
}

export const walletTabStore = reactive<WalletStore>({
  tabs,
  selectedTab: tabs[0],
})
