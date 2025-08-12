import connector from '../connector'
import { getCurrentAccountId } from '../account'
import useStorage from '../storage'
import { AutoPaymentAmountKey, AutoPaymentListKey, EnabledAutoPaymentKey } from './auto-payment'

export async function process(_: unknown, { host }: { host: string }) {
  const storage = useStorage()
  const isEnabled = await storage.get(EnabledAutoPaymentKey, { defaultValue: true })
  const list: { logo?: string; host: string }[] = await storage.get(AutoPaymentListKey, { defaultValue: [] })
  const autoPaymentAmount = await storage.get(AutoPaymentAmountKey, { defaultValue: 10000 })
  const autoPaymentList = list ?? []
  return {
    isEnabled: isEnabled,
    isApproved: autoPaymentList.some((item) => item.host === host),
    autoPaymentAmount: autoPaymentAmount,
  }
}
