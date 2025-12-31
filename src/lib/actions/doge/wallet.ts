/**
 * Get current DOGE wallet instance
 */

import { DogeWallet, AddressType } from '@metalet/utxo-wallet-service'
import { getNet } from '@/lib/network'
import { getActiveWalletOnlyAccount } from '@/lib/wallet'
import { getPassword } from '@/lib/lock'
import { decrypt } from '@/lib/crypto'
import { getV3AddressTypeStorage } from '@/lib/addressType'
import { Chain } from '@metalet/utxo-wallet-service'

export interface GetDogeWalletOptions {
  mnemonic?: string
  password?: string
  addressIndex?: number
  addressType?: AddressType
  coinType?: number
}

/**
 * Get current DOGE wallet
 */
export async function getDogeWallet(options?: GetDogeWalletOptions): Promise<DogeWallet> {
  const network = getNet()
  const activeWallet = await getActiveWalletOnlyAccount()
  
  let mnemonic = options?.mnemonic
  if (!mnemonic) {
    const password = options?.password || (await getPassword())
    mnemonic = decrypt(activeWallet.mnemonic, password)
  }
  
  const addressIndex = options?.addressIndex ?? activeWallet.accounts[0].addressIndex
  const addressType = options?.addressType ?? (await getV3AddressTypeStorage(Chain.DOGE))
  
  // Use custom MVC coinType if addressType is DogeSameAsMvc
  // This ensures DOGE Default address follows user's custom MVC path
  const coinType = options?.coinType ?? activeWallet.mvcTypes[0]

  return new DogeWallet({
    mnemonic,
    network,
    addressIndex,
    addressType,
    coinType,
  })
}
