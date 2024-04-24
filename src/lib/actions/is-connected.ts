import connector from '../connector'
import { getCurrentAccountId } from '../account'

export async function process(_: unknown, host: string) {
  const currentAccountId = await getCurrentAccountId()

  if (!currentAccountId) return false

  return connector.isConnected(currentAccountId, host)
}
