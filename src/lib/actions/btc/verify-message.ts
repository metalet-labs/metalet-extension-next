import { getNetwork } from '@/lib/network'
import { getPrivateKey, getPublicKey } from '@/lib/account'
import { Message, PrivateKey, Networks } from 'bitcore-lib'
import { getCurrentWallet } from '@/lib/wallet'
import { Chain } from '@metalet/utxo-wallet-service'

interface verifyMessageParams {
  text: string
  sig: string
  publicKey: string
  encoding?: BufferEncoding
}

export async function process(params: verifyMessageParams) {
  const { text, sig: signature, publicKey, encoding } = params
  const wallet = await getCurrentWallet(Chain.BTC)
  return wallet.verifyMessage({ text, signature, publicKey, encoding })
}
