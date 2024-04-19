import { goToPage } from './utils'
import useStorage from '@/lib/storage'
import { type V3Wallet } from './types'
import { toast } from '@/components/ui/toast'
import { getCurrentAccountId } from './account'

const CURRENT_WALLET_ID = 'currentWalletId'
export const V3_WALLETS_STORAGE_KEY = 'wallets_v3'

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

export async function addV3Wallet(wallet: V3Wallet) {
  const v3Wallet = await getV3Wallets()
  if (v3Wallet.find((w) => w.mnemonic === wallet.mnemonic)) {
    throw new Error('Wallet already exists')
  }
  const wallets = await getV3WalletsStorage()
  wallets[wallet.id] = wallet
  await setV3WalletsStorage(wallets)
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
  if (!walletId) {
    throw new Error('current wallet id not found')
  }
  const wallets = await getV3Wallets()
  if (!wallets.length) {
    throw new Error('wallets not found')
  }
  const wallet = wallets.find((wallet) => wallet.id === walletId)
  if (!wallet) {
    throw new Error('wallet not found')
  }
  return wallet
}

export async function getActiveWalletOnlyAccount() {
  const walletId = await getCurrentWalletId()
  if (!walletId) {
    throw new Error('current wallet id not found')
  }
  const wallets = await getV3Wallets()
  if (!wallets.length) {
    throw new Error('wallets not found')
  }
  const wallet = wallets.find((wallet) => wallet.id === walletId)
  if (!wallet) {
    throw new Error('wallet not found')
  }

  const { accounts } = wallet
  if (!accounts || !accounts.length) {
    throw new Error('wallet does not have any accounts')
  }
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    throw new Error('current account id not found')
  }
  const account = accounts.find((account) => account.id === currentAccountId)
  if (!account) {
    throw new Error('current account not found')
  }
  wallet.accounts = [account]
  return wallet
}

export async function getInactiveWallets() {
  const currentWalletId = await getCurrentWalletId()
  if (!currentWalletId) {
    throw new Error('Current wallet id not found.')
  }
  const wallets = await getV3Wallets()
  if (!wallets.length) {
    throw new Error('No wallets found. Please create a wallet first.')
  }
  return wallets.filter((wallet) => wallet.id !== currentWalletId)
}

export async function getActiveWalletOtherAccounts() {
  const walletId = await getCurrentWalletId()
  if (!walletId) {
    throw new Error('current wallet id not found')
  }
  const wallets = await getV3Wallets()
  if (!wallets.length) {
    throw new Error('wallets not found')
  }
  const wallet = wallets.find((wallet) => wallet.id === walletId)
  if (!wallet) {
    throw new Error('wallet not found')
  }

  const { accounts } = wallet
  if (!accounts || !accounts.length) {
    throw new Error('wallet does not have any accounts')
  }
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    throw new Error('current account id not found')
  }
  wallet.accounts = accounts.filter((account) => account.id !== currentAccountId)
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

export async function updateWalletName(walletId: string, name: string) {
  try {
    const walletsMap = await getV3WalletsStorage()
    if (!walletsMap) {
      throw new Error('V3 wallets storage not found.')
    }
    const wallet = walletsMap[walletId]
    if (!wallet) {
      throw new Error(`Wallet not found with id ${walletId}.`)
    }
    wallet.name = name
    await setV3WalletsStorage(walletsMap)
  } catch (error) {
    toast({ title: (error as Error).message, toastType: 'warning' })
    goToPage('/manage/wallets')
  }
}

export async function updateAccountName(walletId: string, accountId: string, name: string) {
  try {
    const walletsMap = await getV3WalletsStorage()
    if (!walletsMap) {
      throw new Error('V3 wallets storage not found.')
    }
    const wallet = walletsMap[walletId]
    if (!wallet) {
      throw new Error(`Wallet not found with id ${walletId}.`)
    }
    const accounts = wallet.accounts
    if (!accounts) {
      throw new Error(`Wallet acounts not found with id ${walletId}.`)
    }
    const account = accounts.find((account) => account.id === accountId)
    if (!account) {
      throw new Error(`Account not found with id ${accountId}.`)
    }
    account.name = name
    await setV3WalletsStorage(walletsMap)
  } catch (error) {
    toast({ title: (error as Error).message, toastType: 'warning' })
    goToPage('/manage/wallets')
  }
}

export async function hasWallets() {
  const wallets = await getV3Wallets()
  return !!wallets.length
}
