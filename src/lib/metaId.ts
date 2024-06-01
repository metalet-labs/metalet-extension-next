import useStorage from './storage'
import { Chain } from '@metalet/utxo-wallet-service'

export type MetaIDTabType = 'MRC20' | 'MetaID PIN'

const MetaID_Tab_Type_Key = 'MetaIDTabType'

const storage = useStorage()

export const metaIds = [
  // { id: 1, name: 'MRC20', disabled: true, chain: Chain.BTC },
  { id: 2, name: 'MetaID PIN', disabled: false, chain: Chain.BTC },
]

export function getMetaIDType() {
  return storage.get<MetaIDTabType>(MetaID_Tab_Type_Key, { defaultValue: metaIds[0].name as MetaIDTabType })
}

export function setMetaIdType(tabType: MetaIDTabType) {
  return storage.set(MetaID_Tab_Type_Key, tabType)
}
