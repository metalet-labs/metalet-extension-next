import useStorage from './storage'
import { BACKUP_V3_KEY } from './storage/key'
import { getCurrentWalletId } from './wallet'

const storage = useStorage()

export const getBackupV3Wallet = async () => {
  return await storage.get<string[]>(BACKUP_V3_KEY, { defaultValue: [] })
}

export const setBackupV3Wallet = async (walletIds: string[]) => {
  await storage.set(BACKUP_V3_KEY, walletIds)
}

export const hasBackupCurrentWallet = async (walletId?: string) => {
  const currentWalletId = await getCurrentWalletId()
  if (!currentWalletId) {
    return false
  }
  const walletIds = await getBackupV3Wallet()
  return walletIds.includes(currentWalletId)
}
