import { getPublicKey } from '../account'
import { getCurrentWallet } from '../wallet'
import { Chain } from '@metalet/utxo-wallet-service'
getPublicKey

export async function process({ path }: { path?: string }, { password }: { password: string }) {
  const wallet = await getCurrentWallet(Chain.MVC, {
    password,
    addressIndex: path ? Number(path.charAt(path.length - 1)) : undefined,
  })
  return wallet.getPublicKey().toString('hex')
}
