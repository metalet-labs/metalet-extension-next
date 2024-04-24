import { getCurrentWallet } from '../../wallet'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process(): Promise<string> {
  const wallet = await getCurrentWallet(Chain.BTC)
  return wallet.getAddress()
}
