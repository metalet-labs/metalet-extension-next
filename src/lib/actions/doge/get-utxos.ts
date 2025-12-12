/**
 * Get DOGE UTXOs Action
 */

import { fetchDogeUtxos } from '@/queries/doge'
import { getDogeWallet } from './wallet'

export async function process(
  {
    needRawTx = false,
  }: {
    needRawTx?: boolean
  },
  { password }: { password: string }
) {
  const wallet = await getDogeWallet({ password })
  const address = wallet.getAddress()
  return await fetchDogeUtxos(address, needRawTx)
}
