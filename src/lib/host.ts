import { getNetwork, network } from './network'
import {
  TX_BROWSER_TESTNET_HOST,
  TX_BROWSER_HOST,
  METASV_HOST,
  METASV_TESTNET_HOST,
  MEMPOOL_HOST,
  MEMPOOL_TESTNET_HOST,
} from '../data/hosts'
import { type Chain } from './types'

export async function getBrowserHost(chain: Chain = 'mvc') {
  const network = await getNetwork()

  if (chain === 'btc') {
    return network === 'testnet' ? MEMPOOL_TESTNET_HOST : MEMPOOL_HOST
  }

  return network === 'testnet' ? TX_BROWSER_TESTNET_HOST : TX_BROWSER_HOST
}

export function getScanUrl(chain: Chain = 'mvc') {
  if (chain === 'btc') {
    return network.value === 'testnet' ? MEMPOOL_TESTNET_HOST : MEMPOOL_HOST
  }

  return network.value === 'testnet' ? TX_BROWSER_TESTNET_HOST : TX_BROWSER_HOST
}

export async function getApiHost() {
  const network = await getNetwork()

  return network === 'testnet' ? METASV_TESTNET_HOST : METASV_HOST
}
