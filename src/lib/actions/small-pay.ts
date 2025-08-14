import { payTransactions } from '../crypto'
import useStorage from '../storage'
import { AutoPaymentAmountKey, AutoPaymentListKey, EnabledAutoPaymentKey } from './auto-payment'

export async function process(params: any, { host }: { host: string }) {
  console.log('small-pay params', params)
  const storage = useStorage()
  const isEnabled = await storage.get(EnabledAutoPaymentKey, { defaultValue: true })
  if (!isEnabled) {
    throw new Error('Auto payment is not enabled')
  }
  const list: { logo?: string; host: string }[] = await storage.get(AutoPaymentListKey, { defaultValue: [] })
  const autoPaymentList = list ?? []
  if (!autoPaymentList.some((item) => item.host === host)) {
    throw new Error('Auto payment not approved for this host')
  }
  const autoPaymentAmount = await storage.get(AutoPaymentAmountKey, { defaultValue: 10000 })
  const toPayTransactions = params.transactions
  const payedTransactions = await payTransactions(toPayTransactions, params.hasMetaid, params.feeb, autoPaymentAmount)

  return { payedTransactions }
}
