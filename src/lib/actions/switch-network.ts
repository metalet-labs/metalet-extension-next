import { getCurrentWallet } from '../wallet'
import { setNetwork, getNetwork, type Network } from '../network'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process({ network }: { network?: Network }) {
  const _network = await getNetwork()
  if (!network) {
    network = _network === 'mainnet' ? 'testnet' : 'mainnet'
  }
  await setNetwork(network)
  const wallet = await getCurrentWallet(Chain.MVC)

  const address = wallet.getAddress()

  return {
    status: 'ok',
    network,
    address,
  }
}
