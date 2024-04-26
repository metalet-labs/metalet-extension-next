import { getCurrentWallet } from '../wallet'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process() {
  const wallet = await getCurrentWallet(Chain.MVC)
  return wallet.getPublicKeyHex()
}
