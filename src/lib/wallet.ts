import { V3Wallet } from './types'
import useStorage from '@/lib/storage'

const CURRENT_WALLET_ID = 'currentWalletId'
const V3_WALLETS_STORAGE_KEY = 'wallets_v3'

const storage = useStorage()

export async function hasV3Wallets(): Promise<boolean> {
  return !!(await storage.get<Record<string, V3Wallet>>(V3_WALLETS_STORAGE_KEY))
}

export async function getV3WalletsStorage() {
  return await storage.get<Record<string, V3Wallet>>(V3_WALLETS_STORAGE_KEY, {
    defaultValue: {},
  })
}

export async function getV3Wallets() {
  return Object.values(await getV3WalletsStorage())
}

export async function setV3WalletsStorage(wallets: Record<string, V3Wallet>) {
  await storage.set(V3_WALLETS_STORAGE_KEY, JSON.stringify(wallets))
}

export async function getCurrentWalletId() {
  return await storage.get(CURRENT_WALLET_ID)
}

export async function setCurrentWalletId(walletId: string) {
  return await storage.set(CURRENT_WALLET_ID, walletId)
}
