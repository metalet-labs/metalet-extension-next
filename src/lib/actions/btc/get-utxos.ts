import { getBtcUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '../../wallet'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process({
  needRawTx = false,
  useUnconfirmed = false,
}: {
  needRawTx?: boolean
  useUnconfirmed?: boolean
}) {
  const wallet = await getCurrentWallet(Chain.BTC)
  return await getBtcUtxos(wallet.getAddress(), needRawTx, useUnconfirmed)
}
