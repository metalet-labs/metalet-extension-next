import connector from '../connector'
import { getCurrentWallet } from '../wallet'
import { getCurrentAccountId } from '../account'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process({ logo }: { logo?: string }, host: string) {
  const wallet = await getCurrentWallet(Chain.MVC)
  const currentAccountId = await getCurrentAccountId()

  if (!wallet || !currentAccountId) {
    return { address: '' }
  }

  await connector.connect(currentAccountId, host, logo)

  return { address: wallet.getAddress() }
}
