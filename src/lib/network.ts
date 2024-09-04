import { ref } from 'vue'
import useStorage from './storage'
import { networks } from 'bitcoinjs-lib'
import { notifyBg } from '@/lib/notify-bg'
import { getCurrentAccountId } from './account'
import { notifyContent } from '@/lib/notify-content'
import { Chain, type Net } from '@metalet/utxo-wallet-service'
import { SERVICE_NETWORK_KEY, NETWORK_KEY } from './storage/key'

// TODO: refactor to use global state

export type Service = Chain[]
export type ServiceStorage = { [accountId: string]: Chain[] }

export type Network = 'mainnet' | 'testnet' | 'regtest'

const storage = useStorage()

export async function setServiceNetwork(_service: ServiceStorage) {
  await storage.set(SERVICE_NETWORK_KEY, _service)
}

export async function getServiceNetworkStorage(): Promise<ServiceStorage> {
  return await storage.get(SERVICE_NETWORK_KEY, { defaultValue: {} })
}

export async function getServiceNetwork(): Promise<Chain[]> {
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    return Object.values(Chain)
  }
  const service = await getServiceNetworkStorage()
  return service[currentAccountId] || Object.values(Chain)
}

export async function hasServiceNetwork(): Promise<boolean> {
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
