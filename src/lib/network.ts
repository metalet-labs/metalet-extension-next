import { ref } from 'vue'
import useStorage from './storage'
import { networks } from 'bitcoinjs-lib'
import { notifyBg } from '@/lib/notify-bg'
import { getCurrentAccountId } from './account'
import { notifyContent } from '@/lib/notify-content'
import { Chain, type Net } from '@metalet/utxo-wallet-service'

// TODO: refactor to use global state

export type Service = Chain | 'all'
export type ServiceStorage = { [accountId: string]: Chain | 'all' }

export type Network = 'mainnet' | 'testnet' | 'regtest'

export const Service_Network_Key = 'service_network'

const storage = useStorage()

export async function setServiceNetwork(_service: ServiceStorage) {
  await storage.set(Service_Network_Key, _service)
}

export async function getServiceNetworkStorage(): Promise<ServiceStorage> {
  return await storage.get(Service_Network_Key, { defaultValue: {} })
}

export async function getServiceNetwork(): Promise<Chain | 'all'> {
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    return 'all'
  }
  const service = await getServiceNetworkStorage()
  return service[currentAccountId] || 'all'
}

export async function hasServiceNetwork(): Promise<boolean> {
  return !!(await storage.get(Service_Network_Key))
}
export const network = ref<Network>(await storage.get('network', { defaultValue: 'mainnet' }))

export async function setNetwork(_network: Network) {
  network.value = _network
  notifyBg('networkChanged')(_network)
  notifyContent('networkChanged')(_network)
  await storage.set('network', _network)
}

export async function getNetwork(): Promise<Network> {
  return await storage.get('network', { defaultValue: 'mainnet' })
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
