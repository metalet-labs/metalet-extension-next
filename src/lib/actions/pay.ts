import { payTransactions } from '../crypto'

export async function process(params: any) {
  const toPayTransactions = params.transactions
  const payedTransactions = await payTransactions(toPayTransactions, params.hasMetaid)

  return { payedTransactions }
}
