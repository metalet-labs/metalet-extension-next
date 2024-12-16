import { signTransaction } from '../crypto'

export async function process(params: any, options?: { password: string }) {
  // console.log('options', options)

  const { txid } = await signTransaction(params.transaction, true, options)
  return { txid }
}
