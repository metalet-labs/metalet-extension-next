import { payTransactions, smallPayTransactions } from '../crypto'
import useStorage from '../storage'
import { AutoPaymentAmountKey, AutoPaymentListKey, EnabledAutoPaymentKey } from './auto-payment'

export async function process(params: any, { host, password }: { host: string; password: string }) {
  console.log('small-pay params', params)
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
  try {
    const autoPaymentAmount = await storage.get(AutoPaymentAmountKey, { defaultValue: 10000 })
    const toPayTransactions = params.transactions
    const payedTransactions = await smallPayTransactions(
      toPayTransactions,
      params.hasMetaid,
      params.feeb,
      autoPaymentAmount,
      { password }
    )

    return { payedTransactions }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred during small payment',
    }
  }
}
