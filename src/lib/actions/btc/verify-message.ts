import { getCurrentWallet } from '@/lib/wallet'
import { Chain } from '@metalet/utxo-wallet-service'

interface verifyMessageParams {
  text: string
  sig: string
  publicKey: string
  encoding?: BufferEncoding
}

export async function process(params: verifyMessageParams, { password }: { password: string }) {
  const { text, sig: signature, publicKey, encoding } = params
  const wallet = await getCurrentWallet(Chain.BTC, { password })
  return wallet.verifyMessage({ text, signature, publicKey, encoding })
}
