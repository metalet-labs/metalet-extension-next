import useStorage from '@/lib/storage'
import { AddressType, Chain } from '@metalet/utxo-wallet-service'

const storage = useStorage()
const V3_BTC_ADDRESS_TYPE_KEY = 'v3_btc_address_type_key'
const V3_MVC_ADDRESS_TYPE_KEY = 'v3_mvc_address_type_key'

export async function getV3AddressTypeStorage(chain: Chain) {
  if (chain === Chain.BTC) {
    return await storage.get<AddressType>(V3_BTC_ADDRESS_TYPE_KEY, {
      defaultValue: AddressType.Legacy,
    })
  } else if (chain === Chain.MVC) {
    return await storage.get<AddressType>(V3_MVC_ADDRESS_TYPE_KEY, {
      defaultValue: AddressType.LegacyMvc,
    })
  }
  throw new Error('Unsupported chain')
}

export async function setV3AddressTypeStorage(chain: Chain, addressType: AddressType) {
  if (chain === Chain.BTC) {
    return await storage.set(V3_BTC_ADDRESS_TYPE_KEY, addressType)
  } else if (chain === Chain.MVC) {
    return await storage.set(V3_MVC_ADDRESS_TYPE_KEY, addressType)
  }
  throw new Error('Unsupported chain')
}
