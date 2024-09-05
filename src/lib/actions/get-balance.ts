import { getBalance } from '../account'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process(_: unknown, { password }: { password: string }) {
  return await getBalance(Chain.MVC, password)
}
