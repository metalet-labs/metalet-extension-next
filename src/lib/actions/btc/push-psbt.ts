import { Psbt } from 'bitcoinjs-lib'
import { getBtcNetwork } from '@/lib/network'
import { broadcastTx } from '@/queries/transaction'
import { Chain } from '@metalet/utxo-wallet-service'

export async function process(psbtHex: string): Promise<string> {
  const network = await getBtcNetwork()
  const rawTx = Psbt.fromHex(psbtHex, { network }).extractTransaction().toHex()
  return broadcastTx(rawTx, Chain.BTC)
}
