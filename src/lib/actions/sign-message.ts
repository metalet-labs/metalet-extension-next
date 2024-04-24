import { getCurrentWallet } from '../wallet'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process(params: any, host: string) {
  const wallet = await getCurrentWallet(Chain.MVC)
  const signature = wallet.signMessage(params.message)
  return { signature }
}
