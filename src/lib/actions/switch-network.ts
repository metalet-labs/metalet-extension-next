import { getCurrentWallet } from '../wallet'
import { setNetwork, getNetwork } from '../network'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process() {
  const network = await getNetwork()
  let switched: 'mainnet' | 'testnet'
  if (network === 'mainnet') {
    await setNetwork('testnet')
    switched = 'testnet'
  } else {
    await setNetwork('mainnet')
    switched = 'mainnet'
  }
  const wallet = await getCurrentWallet(Chain.MVC)

  const address = wallet.getAddress()

  return {
    status: 'ok',
    network: switched,
    address,
  }
}
