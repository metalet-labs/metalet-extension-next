import { signTransaction } from '../crypto'

export async function process(params: any) {
  const { txid } = await signTransaction(params.transaction, true)
  return { txid }
}
