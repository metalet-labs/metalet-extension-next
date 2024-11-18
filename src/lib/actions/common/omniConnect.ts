import connector from '../../connector'
import { getCurrentWallet } from '../../wallet'
import { getCurrentAccountId } from '../../account'
import { Chain } from '@metalet/utxo-wallet-service'

interface AccountInfo {
  address: string
  pubKey: string
}

// FIXME：Restrict for chain or full connection
export async function process(
  _: unknown,
  host: string
): Promise<{
  btc: AccountInfo
  mvc: AccountInfo
}> {
  const accountInfo = {
    btc: {
      address: '',
      pubKey: '',
    },
    mvc: {
      address: '',
      pubKey: '',
    },
  }

  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    throw new Error('No current account')
  }
  await connector.connect(currentAccountId, host)
  const btcWallet = await getCurrentWallet(Chain.BTC)
  if (btcWallet) {
    accountInfo.btc = {
      address: btcWallet.getAddress(),
      pubKey: btcWallet.getPublicKey().toString('hex'),
    }
  }
  const mvcWallet = await getCurrentWallet(Chain.MVC)
  if (mvcWallet) {
    accountInfo.mvc = {
      address: mvcWallet.getAddress(),
      pubKey: mvcWallet.getPublicKey().toString('hex'),
    }
  }
  return accountInfo
}
