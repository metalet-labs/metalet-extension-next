import { reactive } from 'vue'
import { Protocol } from '@/lib/types/protocol'
import { Chain } from '@metalet/utxo-wallet-service'

interface TabType {
  id: number
  name: string
  chain: Chain
  disabled: boolean
  textColor: string
}

const tabs: TabType[] = [
  { id: 1, name: Protocol.Runes, disabled: false, chain: Chain.BTC, textColor: 'text-runes' },
  { id: 2, name: Protocol.BRC20, disabled: false, chain: Chain.BTC, textColor: 'text-brc20' },
  { id: 4, name: Protocol.MetaContract, disabled: false, chain: Chain.MVC, textColor: 'text-runes' },
]

interface SwapTabStore {
  tabs: TabType[]
  selectedTab: TabType
}

export const swapTabStore = reactive<SwapTabStore>({
  tabs,
  selectedTab: tabs[0],
})
