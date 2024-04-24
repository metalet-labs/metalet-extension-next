import { signTransactions } from '../crypto'

export async function process(params: any) {
  const signingTransactions = params.transactions
  const signedTransactions = await signTransactions(signingTransactions)
  return { signedTransactions }
}
