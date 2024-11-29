import { getNetwork } from './network'
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
