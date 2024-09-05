import { getCurrentWallet } from '../../wallet'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process(_: unknown, { password }: { password: string }): Promise<string> {
  const wallet = await getCurrentWallet(Chain.BTC, { password })
  return wallet.getPublicKey().toString('hex')
}
