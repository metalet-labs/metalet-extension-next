import { ref } from 'vue'
import useStorage from './storage'
import { networks } from 'bitcoinjs-lib'
import { type Chain } from '@/lib/types'
import { notifyBg } from '@/lib/notify-bg'
import { notifyContent } from '@/lib/notify-content'
import { type Net } from '@metalet/utxo-wallet-service'

// TODO: refactor to use global state

export type Service = Chain | 'all'

export type Network = 'mainnet' | 'testnet' | 'regtest'

export const Service_Network_Key = 'service_network'

const storage = useStorage()

export async function setServiceNetwork(_service: Service) {
  await storage.set(Service_Network_Key, _service)
}

export async function getServiceNetwork(): Promise<Service> {
  return await storage.get(Service_Network_Key, { defaultValue: 'all' })
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
  return network.value === 'mainnet' ? networks.bitcoin : networks.testnet
}

export function getNet(): Net {
  return network.value === 'mainnet' ? 'livenet' : network.value
}
