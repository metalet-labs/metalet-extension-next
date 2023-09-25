import { getAddress, getCurrentAccount } from '../account'
import connector from '../connector'

export async function process(params: any, host: string) {
  console.log('connect process load')

  const account = await getCurrentAccount()

  if (!account) {
    return { address: '', txid: '' }
  }

  await connector.connect(account.id, host)

  const address = await getAddress()

  return { address }
}
