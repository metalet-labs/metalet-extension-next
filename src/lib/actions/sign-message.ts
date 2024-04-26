import { mvc } from 'meta-contract'
import { signMessage } from '../crypto'
import { getCurrentWallet } from '../wallet'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process(params: any) {
  const wallet = await getCurrentWallet(Chain.MVC)
  const wif = wallet.getPrivateKey()
  const privateKeyObj = mvc.PrivateKey.fromWIF(wif)
  const signature = signMessage(params.message, privateKeyObj, params.encoding)
  return { signature }
}
