import { payTransactionsWithUtxos } from '../crypto'
import type { SA_utxo } from '../crypto'

interface SignPartialTxParams {
  toPayTransactions: {
    txComposer: string
    message?: string
  }[]
  utxos: SA_utxo[]
  signType?: number
  hasMetaid?: boolean
}

export async function process(params: SignPartialTxParams) {
  const toPayTransactions = params.toPayTransactions
  const utxos = params.utxos
  const signType = params.signType || 0x01
  const payedTransactions = await payTransactionsWithUtxos(toPayTransactions, utxos, signType, params.hasMetaid)

  return { payedTransactions }
} 