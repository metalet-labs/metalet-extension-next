import { getUtxos } from '@/lib/account'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process() {
  return await getUtxos(Chain.BTC)
}
