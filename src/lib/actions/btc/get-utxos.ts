import { getBtcUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '../../wallet'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process(
  {
    needRawTx = false,
    useUnconfirmed = false,
  }: {
    needRawTx?: boolean
    useUnconfirmed?: boolean
  },
  { password }: { password: string }
) {
  const wallet = await getCurrentWallet(Chain.BTC, { password })
  return await getBtcUtxos(wallet.getAddress(), needRawTx, useUnconfirmed)
}
