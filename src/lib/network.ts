import { ref } from 'vue'
import useStorage from './storage'
import { networks } from 'bitcoinjs-lib'
import { notifyBg } from '@/lib/notify-bg'
import { getCurrentAccountId } from './account'
import { notifyContent } from '@/lib/notify-content'
import { Chain, type Net } from '@metalet/utxo-wallet-service'
import { SERVICE_NETWORK_KEY, SERVICE_NETWORK_V2_KEY, NETWORK_KEY } from './storage/key'

// TODO: refactor to use global state

// Extended chain type to include DOGE (which is not in @metalet/utxo-wallet-service)
export type ExtendedChain = Chain | 'doge'
export type Service = ExtendedChain[]
export type ServiceStorage = { [accountId: string]: ExtendedChain[] }

// Default chains including DOGE
const defaultChains: ExtendedChain[] = [...Object.values(Chain), 'doge']

export type Network = 'mainnet' | 'testnet' | 'regtest'

const storage = useStorage()

export async function setServiceNetwork(_service: ServiceStorage) {
  await storage.set(SERVICE_NETWORK_V2_KEY, _service)
}

export async function getServiceNetworkStorage(): Promise<ServiceStorage> {
  // First try to get from v2 key (with DOGE support)
  const v2Service = await storage.get<ServiceStorage>(SERVICE_NETWORK_V2_KEY)
  if (v2Service) {
    return v2Service
  }
  
  // If v2 doesn't exist, migrate from v1 and add DOGE
  const v1Service = await storage.get<ServiceStorage>(SERVICE_NETWORK_KEY)
  if (v1Service) {
    // Migrate v1 data: add 'doge' to each account's chain list
    const migratedService: ServiceStorage = {}
    for (const accountId of Object.keys(v1Service)) {
      const chains = v1Service[accountId] as ExtendedChain[]
      if (!chains.includes('doge')) {
        migratedService[accountId] = [...chains, 'doge']
      } else {
        migratedService[accountId] = chains
      }
    }
    // Save migrated data to v2 key
    await storage.set(SERVICE_NETWORK_V2_KEY, migratedService)
    return migratedService
  }
  
  return {}
}

export async function getServiceNetwork(): Promise<ExtendedChain[]> {
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    return defaultChains
  }
  const service = await getServiceNetworkStorage()
  return service[currentAccountId] || defaultChains
}

export async function hasServiceNetwork(): Promise<boolean> {
  // Check both v2 and v1 keys
  const v2 = await storage.get(SERVICE_NETWORK_V2_KEY)
  if (v2) return true
  return !!(await storage.get(SERVICE_NETWORK_KEY))
}
export const network = ref<Network>(await storage.get(NETWORK_KEY, { defaultValue: 'mainnet' }))

export async function setNetwork(_network: Network) {
  network.value = _network
  notifyBg('networkChanged')(_network)
  notifyContent('networkChanged')(_network)
  await storage.set(NETWORK_KEY, _network)
}

export async function getNetwork(): Promise<Network> {
  return await storage.get(NETWORK_KEY, { defaultValue: 'mainnet' })
}

export function getBtcNetwork() {
  switch (network.value) {
    case 'mainnet':
      return networks.bitcoin
    case 'testnet':
      return networks.testnet
    case 'regtest':
      return networks.regtest
    default:
      throw new Error('Unknown network')
  }
}

export function getNet(): Net {
  return network.value === 'mainnet' ? 'livenet' : network.value
}
