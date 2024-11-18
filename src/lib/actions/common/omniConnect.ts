import connector from '../../connector'
import { getCurrentWallet } from '../../wallet'
import { getCurrentAccountId } from '../../account'
import { Chain } from '@metalet/utxo-wallet-service'

interface AccountInfo {
  chain: Chain
  address: string
  pubKey: string
}

// FIXME：Restrict for chain or full connection
export async function process(_: unknown, host: string): Promise<AccountInfo[]> {
  const accounts = [] as AccountInfo[]

  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    throw new Error('No current account')
  }
  await connector.connect(currentAccountId, host)
  const btcWallet = await getCurrentWallet(Chain.BTC)
  if (btcWallet) {
    accounts.push({
      address: btcWallet.getAddress(),
      pubKey: btcWallet.getPublicKey().toString('hex'),
      chain: Chain.BTC,
    })
  }
  const mvcWallet = await getCurrentWallet(Chain.MVC)
  if (mvcWallet) {
    accounts.push({
      address: mvcWallet.getAddress(),
      pubKey: mvcWallet.getPublicKey().toString('hex'),
      chain: Chain.MVC,
    })
  }
  return accounts
}
