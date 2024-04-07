import { goToPage } from './utils'
import { V3Wallet } from './types'
import useStorage from '@/lib/storage'
import { getCurrentAccountId } from './account'

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

export async function getV3CurrentWallet() {
  const walletId = await getCurrentWalletId()
  const wallets = await getV3Wallets()
  if (!walletId || !wallets.length) {
    goToPage('/manage/wallets')
    throw new Error('current wallet id not found')
  }
  const wallet = wallets.find((wallet) => wallet.id === walletId)
  if (!wallet) {
    goToPage('/manage/wallets')
    throw new Error('wallet not found')
  }

  const { accounts } = wallet
  if (!accounts || !accounts.length) {
    goToPage('/manage/wallets')
    throw new Error('wallet does not have any accounts')
  }
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    goToPage('/manage/wallets')
    throw new Error('current account id not found')
  }
  const account = accounts.find((account) => account.id === currentAccountId)
  if (!account) {
    goToPage('/manage/wallets')
    throw new Error('current account not found')
  }
  wallet.accounts = [account]
  return wallet
}

export async function getV3CurrentAccount() {
  const walletId = await getCurrentWalletId()
  const wallets = await getV3Wallets()
  if (!walletId || !wallets.length) {
    goToPage('/manage/wallets')
    throw new Error('current wallet id not found')
  }
  const wallet = wallets.find((wallet) => wallet.id === walletId)
  if (!wallet) {
    goToPage('/manage/wallets')
    throw new Error('wallet not found')
  }

  const { accounts } = wallet
  if (!accounts || !accounts.length) {
    goToPage('/manage/wallets')
    throw new Error('wallet does not have any accounts')
  }
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    goToPage('/manage/wallets')
    throw new Error('current account id not found')
  }
  const account = accounts.find((account) => account.id === currentAccountId)
  if (!account) {
    goToPage('/manage/wallets')
    throw new Error('current account not found')
  }
  return account
}
