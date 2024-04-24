import { getPrivateKey } from '@/lib/account'
import { getCurrentWallet } from '@/lib/wallet'
import { Chain } from '@metalet/utxo-wallet-service'
import { Message, PrivateKey } from 'bitcore-lib'

export async function process(message: string): Promise<string> {
  const wallet = await getCurrentWallet(Chain.BTC)
  return wallet.signMessage(message)
}
