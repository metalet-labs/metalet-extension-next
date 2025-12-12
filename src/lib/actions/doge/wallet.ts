/**
 * Get current DOGE wallet instance
 */

import { DogeWallet } from '@/lib/doge'
import { getNet } from '@/lib/network'
import { getActiveWalletOnlyAccount } from '@/lib/wallet'
import { getPassword } from '@/lib/lock'
import { decrypt } from '@/lib/crypto'

// DOGE network type - can be livenet (mainnet) or testnet
type DogeNetworkType = 'livenet' | 'testnet'

export interface GetDogeWalletOptions {
  mnemonic?: string
  password?: string
  addressIndex?: number
}

/**
 * Get current DOGE wallet
 */
export async function getDogeWallet(options?: GetDogeWalletOptions): Promise<DogeWallet> {
  const netValue = getNet()
  const network: DogeNetworkType = netValue === 'livenet' ? 'livenet' : 'testnet'
  const activeWallet = await getActiveWalletOnlyAccount()
  
  let mnemonic = options?.mnemonic
  if (!mnemonic) {
    const password = options?.password || (await getPassword())
    mnemonic = decrypt(activeWallet.mnemonic, password)
  }
  
  const addressIndex = options?.addressIndex ?? activeWallet.accounts[0].addressIndex

  return new DogeWallet({
    mnemonic,
    network,
    addressIndex,
  })
}
