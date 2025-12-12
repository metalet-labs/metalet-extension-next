/**
 * Get DOGE Address Action
 */

import { getDogeWallet } from './wallet'

export async function process(
  _: unknown, 
  { password }: { password: string }
): Promise<string> {
  const wallet = await getDogeWallet({ password })
  return wallet.getAddress()
}
