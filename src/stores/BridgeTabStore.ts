import { reactive } from 'vue'
import { Protocol } from '@/lib/types/protocol'
import { Chain } from '@metalet/utxo-wallet-service'

interface TabType {
  id: number
  name: string
  chains: Chain[]
  disabled: boolean
}

const tabs: TabType[] = [
  { id: 1, name: 'BTC', disabled: false, chains: [Chain.BTC, Chain.MVC] },
  { id: 2, name: Protocol.MRC20, disabled: false, chains: [Chain.BTC, Chain.MVC] },
  { id: 3, name: Protocol.BRC20, disabled: false, chains: [Chain.BTC, Chain.MVC] },
  { id: 4, name: Protocol.Runes, disabled: false, chains: [Chain.BTC, Chain.MVC] },
]

interface BridgeTabStore {
  tabs: TabType[]
  selectedTab: TabType
}

export const bridgeTabStore = reactive<BridgeTabStore>({
  tabs,
  selectedTab: tabs[0],
})
