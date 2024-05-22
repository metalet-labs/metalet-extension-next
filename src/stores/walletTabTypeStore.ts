import { reactive } from 'vue'

interface TabType {
  id: number
  name: string
  disabled: boolean
  isNew: boolean
}

const tabs: TabType[] = [
  { id: 1, name: 'Crypto', disabled: false, isNew: false },
  { id: 2, name: 'NFTs', disabled: false, isNew: false },
  { id: 3, name: 'Runes', disabled: false, isNew: true },
  // { id: 4, name: 'Activity', disabled: false ,isNew:false},
]

interface WalletStore {
  tabs: TabType[]
  selectedTab: TabType
}

export const walletTabStore = reactive<WalletStore>({
  tabs,
  selectedTab: tabs[0],
})
