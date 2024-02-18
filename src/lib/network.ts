import { ref } from 'vue'
import { Chain } from '@/lib/account'
import { networks } from 'bitcoinjs-lib'

import storage from './storage'
import { notifyContent } from '@/lib/notify-content'

export type Service = Chain | 'all'

export type Network = 'mainnet' | 'testnet'

export const Service_Network_Key = 'service_network'

export const network = ref<Network>(await storage.get('network', { defaultValue: 'mainnet' }))

export const service = ref<Service>(await storage.get(Service_Network_Key, { defaultValue: 'all' }))

export async function setServiceNetwork(_service: Service) {
  await storage.set(Service_Network_Key, _service)
  service.value = _service
}

export async function getServiceNetwork(): Promise<Service> {
  return await storage.get(Service_Network_Key, { defaultValue: 'all' })
}

export async function setNetwork(_network: Network) {
  await storage.set('network', _network)
  network.value = _network
  notifyContent('networkChanged')(_network)
}

export async function getNetwork(): Promise<Network> {
  return await storage.get('network', { defaultValue: 'mainnet' })
}

export function getBtcNetwork() {
  return network.value === 'mainnet' ? networks.bitcoin : networks.testnet
}

export function getNet(): string {
  return network.value === 'mainnet' ? 'livenet' : network.value
}
