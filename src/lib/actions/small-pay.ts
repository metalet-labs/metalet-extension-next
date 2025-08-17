import { payTransactions, smallPayTransactions } from '../crypto'
import useStorage from '../storage'
import {
  AutoPayment24HLimit,
  AutoPaymentAmountKey,
  AutoPaymentHistoryKey,
  AutoPaymentListKey,
  EnabledAutoPaymentKey,
} from './auto-payment'
import { clearChunkData, getChunkData } from './storage-chunk'
export type SigningTransaction = {
  txComposer: string
  message?: string
}

export type PayTransactionsParams = {
  transactions: SigningTransaction[]
  hasMetaid?: boolean
  feeb?: number
}

export type PayParams = {
  transactions?: SigningTransaction[]
  hasMetaid?: boolean
  feeb?: number
  useChunk?: boolean
  chunkKey?: string
}
export async function process(params: PayParams, { host, password }: { host: string; password: string }) {
  const storage = useStorage()
  const isEnabled = await storage.get(EnabledAutoPaymentKey, { defaultValue: true })
  if (!isEnabled) {
    return {
      status: 'error',
      message: 'Auto payment is not enabled',
    }
  }
  const list: { logo?: string; host: string }[] = await storage.get(AutoPaymentListKey, { defaultValue: [] })
  const autoPaymentList = list ?? []
  if (!autoPaymentList.some((item) => item.host === host)) {
    return {
      status: 'error',
      message: 'Auto payment not approved for this host',
    }
  }
  let autoPaymentHistory: { cost: number; timestamp: number }[] = await storage.get(AutoPaymentHistoryKey, {
    defaultValue: [],
  })
  autoPaymentHistory = autoPaymentHistory.filter((item) => {
    return item.timestamp > Date.now() - 24 * 60 * 60 * 1000 // keep only last 24 hours
  })
  const totalCost = autoPaymentHistory.reduce((acc, item) => acc + item.cost, 0)
  if (totalCost >= AutoPayment24HLimit) {
    return {
      status: 'error',
      message: `Auto payment limit reached for the last 24 hours: ${totalCost} sats`,
    }
  }
  try {
    let autoPaymentAmount = await storage.get(AutoPaymentAmountKey, { defaultValue: 10000 })
    let _params: PayTransactionsParams
    if (params.useChunk && params.chunkKey) {
      const chunkData = await getChunkData(params.chunkKey)
      if (!chunkData) {
        return {
          status: 'error',
          message: 'Chunk data not found',
        }
      }
      _params = JSON.parse(chunkData) as PayTransactionsParams
    } else {
      _params = {
        transactions: params.transactions || [],
        hasMetaid: params.hasMetaid,
        feeb: params.feeb,
      }
    }

    const toPayTransactions = _params.transactions
    const { payedTransactions, cost } = await smallPayTransactions(
      toPayTransactions,
      _params.hasMetaid,
      _params.feeb,
      autoPaymentAmount,
      { password }
    )
    if (params.useChunk && params.chunkKey) {
      await clearChunkData()
    }
    await storage.set(AutoPaymentHistoryKey, [...autoPaymentHistory, { cost, timestamp: Date.now() }])
    return { payedTransactions }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred during small payment',
    }
  }
}
