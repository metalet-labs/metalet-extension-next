import useStorage from '../storage'
export const EnabledAutoPaymentKey = 'enabledAutoPayment'
export const AutoPaymentListKey = 'autoPaymentList'
export const AutoPaymentAmountKey = 'autoPaymentAmount'
export const AutoPaymentHistoryKey = 'autoPaymentHistory'
export const AutoPayment24HLimit = 2000000
export async function process({ logo }: { logo?: string }, host: string) {
  const storage = useStorage()
  const isEnabled = await storage.get(EnabledAutoPaymentKey, {
    defaultValue: true,
  })
  if (!isEnabled) {
    throw new Error('Auto payment is not enabled')
  }
  const list: { logo?: string; host: string }[] = await storage.get(AutoPaymentListKey, { defaultValue: [] })
  const autoPaymentList = list ?? []
  autoPaymentList.push({ logo, host })
  await storage.set(AutoPaymentListKey, autoPaymentList)
  return {
    message: 'Auto payment approved',
  }
}
