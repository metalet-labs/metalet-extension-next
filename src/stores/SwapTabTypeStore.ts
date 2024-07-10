import { reactive } from 'vue'
import { Protocol } from '@/lib/types/protocol'
import { Chain } from '@metalet/utxo-wallet-service'

interface TabType {
  id: number
  name: string
  chain: Chain
  disabled: boolean
}

const tabs: TabType[] = [
  { id: 1, name: Protocol.Rune, disabled: false, chain: Chain.BTC },
  { id: 2, name: Protocol.BRC20, disabled: false, chain: Chain.BTC },
  { id: 3, name: Protocol.MRC20, disabled: false, chain: Chain.BTC },
  { id: 4, name: Protocol.MetaContract, disabled: false, chain: Chain.MVC },
]

interface SwapTabStore {
  tabs: TabType[]
  selectedTab: TabType
}

export const swapTabStore = reactive<SwapTabStore>({
  tabs,
  selectedTab: tabs[0],
})
