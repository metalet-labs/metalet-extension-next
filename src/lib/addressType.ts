import useStorage from '@/lib/storage'
import { AddressType, Chain } from '@metalet/utxo-wallet-service'
import { getCurrentAccountId } from './account'

const storage = useStorage()
const V3_BTC_ADDRESS_TYPE_RECORD__KEY = 'v3_btc_address_type_record'
const V3_MVC_ADDRESS_TYPE_RECORD_KEY = 'v3_mvc_address_type_record'

export interface AddressTypeRecord {
  [accountId: string]: AddressType
}

export async function getV3AddressTypeRecordStorage(chain: Chain) {
  if (chain === Chain.BTC) {
    return await storage.get<AddressTypeRecord>(V3_BTC_ADDRESS_TYPE_RECORD__KEY, {
      defaultValue: {},
    })
  } else if (chain === Chain.MVC) {
    return await storage.get<AddressTypeRecord>(V3_MVC_ADDRESS_TYPE_RECORD_KEY, {
      defaultValue: {},
    })
  }
  throw new Error('Unsupported chain')
}

export async function getV3AddressTypeStorage(chain: Chain) {
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    throw new Error('No account selected')
  }
  const addressTypeRecord = await getV3AddressTypeRecordStorage(chain)
  return addressTypeRecord[currentAccountId] || (chain === Chain.MVC ? AddressType.LegacyMvc : AddressType.Legacy)
}

export async function setV3AddressTypeStorage(chain: Chain, addressType: AddressType) {
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    throw new Error('No account selected')
  }
  const addressTypeRecord = await getV3AddressTypeRecordStorage(chain)
  addressTypeRecord[currentAccountId] = addressType
  if (chain === Chain.BTC) {
    return await storage.set(V3_BTC_ADDRESS_TYPE_RECORD__KEY, addressTypeRecord)
  } else if (chain === Chain.MVC) {
    return await storage.set(V3_MVC_ADDRESS_TYPE_RECORD_KEY, addressTypeRecord)
  }
  throw new Error('Unsupported chain')
}

export async function migrateV3AddressTypeStorage(chain: Chain, v2AddressTypeRecord: AddressTypeRecord) {
  const addressTypeRecord = await getV3AddressTypeRecordStorage(chain)
  for (const [accountId, addressType] of Object.entries(v2AddressTypeRecord)) {
    addressTypeRecord[accountId] = addressType
  }
  if (chain === Chain.BTC) {
    return await storage.set(V3_BTC_ADDRESS_TYPE_RECORD__KEY, addressTypeRecord)
  } else if (chain === Chain.MVC) {
    return await storage.set(V3_MVC_ADDRESS_TYPE_RECORD_KEY, addressTypeRecord)
  }
  throw new Error('Unsupported chain')
}
