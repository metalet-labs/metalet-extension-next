/**
 * Get DOGE Balance Action
 */

import { fetchDogeBalance } from '@/queries/doge'
import { getDogeWallet } from './wallet'

export async function process(
  _: unknown, 
  { password }: { password: string }
) {
  const wallet = await getDogeWallet({ password })
  const address = wallet.getAddress()
  return await fetchDogeBalance(address)
}
