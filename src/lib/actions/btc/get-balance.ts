import { getBalance } from '@/lib/account'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process() {
  return await getBalance(Chain.BTC)
}
