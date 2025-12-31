import { getNet } from './network'
import useStorage from '@/lib/storage'
import { type V3Wallet } from './types'
import { getCurrentAccountId, setCurrentAccountId } from './account'
import { getV3AddressTypeStorage } from './addressType'
import { Chain, MvcWallet, BtcWallet, AddressType, CoinType } from '@metalet/utxo-wallet-service'
import {
  WALLET_NUM,
  CURRENT_WALLET_ID,
  V3_WALLETS_STORAGE_KEY,
  V3_ENCRYPTED_WALLETS_STORAGE_KEY,
  V3_ENCRYPTED_WALLETS_STORAGE_BACKUP_KEY,
} from '@/lib/storage/key'
import { getPassword } from './lock'
import { decrypt } from './crypto'

const storage = useStorage()

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

export async function hasV3EncryptedWallets(): Promise<boolean> {
  return !!(await storage.get<Record<string, V3Wallet>>(V3_ENCRYPTED_WALLETS_STORAGE_KEY))
}

export async function getV3EncryptedWalletsStorage() {
  return await storage.get<Record<string, V3Wallet>>(V3_ENCRYPTED_WALLETS_STORAGE_KEY, {
    defaultValue: {},
  })
}

export async function setV3EncryptedWalletsStorage(wallets: Record<string, V3Wallet>) {
  await storage.set(V3_ENCRYPTED_WALLETS_STORAGE_KEY, JSON.stringify(wallets))
}

export async function backupV3EncryptedWalletsStorage() {
  const wallets = await getV3EncryptedWalletsStorage()
  await storage.set(V3_ENCRYPTED_WALLETS_STORAGE_BACKUP_KEY, JSON.stringify(wallets))
}

export async function getV3EncryptedWallets() {
  return Object.values(await getV3EncryptedWalletsStorage())
}

export async function getV3WalletsNum() {
  const wallets = await getV3EncryptedWallets()
  return await storage.get<number>(WALLET_NUM, {
    defaultValue: wallets.length,
  })
}

export async function setV3WalletsNum(num: number) {
  return await storage.set(WALLET_NUM, num)
}

export async function addV3Wallet(wallet: V3Wallet) {
  const v3Wallet = await getV3EncryptedWallets()
  if (v3Wallet.find((w) => w.mnemonic === wallet.mnemonic)) {
    throw new Error('Wallet already exists')
  }
  const wallets = await getV3EncryptedWalletsStorage()
  wallets[wallet.id] = wallet
  await setV3EncryptedWalletsStorage(wallets)
}

export async function getCurrentWalletId(expectError = true) {
  const currentWalletId = await storage.get(CURRENT_WALLET_ID)
  if (!currentWalletId) {
    const wallets = await getV3EncryptedWallets()
    if (wallets.length) {
      await setCurrentWalletId(wallets[0].id)
      return wallets[0].id
    }
  }
  return currentWalletId
}

export async function setCurrentWalletId(walletId: string) {
  return await storage.set(CURRENT_WALLET_ID, walletId)
}

export async function getV3CurrentWallet() {
  const walletId = await getCurrentWalletId()
  if (!walletId) {
    throw new Error('current wallet id not found')
  }
  const wallets = await getV3EncryptedWallets()
  if (!wallets.length) {
    throw new Error('wallets not found')
  }
  const wallet = wallets.find((wallet) => wallet.id === walletId)
  if (!wallet) {
    throw new Error('wallet not found')
  }
  return wallet
}

export async function getActiveWallet() {
  const currentWalletId = await getCurrentWalletId()
  if (!currentWalletId) {
    throw new Error('currentWalletId id not found')
  }
  const wallets = await getV3EncryptedWallets()
  if (!wallets.length) {
    throw new Error('wallets not found')
  }
  let wallet = wallets.find((wallet) => wallet.id === currentWalletId)
  if (!wallet) {
    throw new Error('wallets not found')
  }
  return wallet
}

export async function getWalletOnlyAccount(walletId: string, accountId: string) {
  if (!walletId) {
    throw new Error('wallet id not found')
  }
  const wallets = await getV3EncryptedWallets()
  if (!wallets.length) {
    throw new Error('wallets not found')
  }
  let wallet = wallets.find((wallet) => wallet.id === walletId)
  if (!wallet) {
    if (wallets.length) {
      wallet = wallets[0]
      await setCurrentWalletId(wallets[0].id)
    } else {
      throw new Error('wallets not found')
    }
  }

  const { accounts } = wallet
  if (!accounts || !accounts.length) {
    throw new Error('wallet does not have any accounts')
  }

  if (!accountId) {
    throw new Error('account id not found')
  }
  let account = accounts.find((account) => account.id === accountId)
  if (!account) {
    if (accounts.length) {
      account = accounts[0]
      await setCurrentAccountId(accounts[0].id)
    } else {
      throw new Error('wallets not found')
    }
  }
  wallet.accounts = [account]
  return wallet
}

export async function getActiveWalletOnlyAccount() {
  const currentWalletId = await getCurrentWalletId()
  const currentAccountId = await getCurrentAccountId()
  if (!currentWalletId) {
    throw new Error('current wallet id not found')
  }
  if (!currentAccountId) {
    throw new Error('current account id not found')
  }
  return getWalletOnlyAccount(currentWalletId, currentAccountId)
}

export async function getInactiveWallets() {
  const currentWalletId = await getCurrentWalletId()
  if (!currentWalletId) {
    throw new Error('Current wallet id not found.')
  }
  const wallets = await getV3EncryptedWallets()
  if (!wallets.length) {
    throw new Error('No wallets found. Please create a wallet first.')
  }
  return wallets.filter((wallet) => wallet.id !== currentWalletId)
}

export async function getWalletOtherAccounts(walletId: string, accountId: string) {
  if (!walletId) {
    throw new Error('wallet id not found')
  }
  const wallets = await getV3EncryptedWallets()
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

  if (!accountId) {
    throw new Error('current account id not found')
  }
  wallet.accounts = accounts.filter((account) => account.id !== accountId)
  return wallet
}

export async function getActiveWalletOtherAccounts() {
  const walletId = await getCurrentWalletId()
  if (!walletId) {
    throw new Error('current wallet id not found')
  }
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    throw new Error('current account id not found')
  }
  return getWalletOtherAccounts(walletId, currentAccountId)
}

export async function getV3CurrentAccount() {
  const walletId = await getCurrentWalletId()
  const wallets = await getV3EncryptedWallets()
  if (!walletId || !wallets.length) {
    throw new Error('current wallet id not found')
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
  return account
}

export async function updateWalletName(walletId: string, name: string) {
  const walletsMap = await getV3EncryptedWalletsStorage()
  if (!walletsMap) {
    throw new Error('V3 wallets storage not found.')
  }
  const wallet = walletsMap[walletId]
  if (!wallet) {
    throw new Error(`Wallet not found with id ${walletId}.`)
  }
  wallet.name = name
  await setV3EncryptedWalletsStorage(walletsMap)
}

export async function updateAccountName(walletId: string, accountId: string, name: string) {
  const walletsMap = await getV3EncryptedWalletsStorage()
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
  await setV3EncryptedWalletsStorage(walletsMap)
}

export async function hasWallets() {
  const wallets = await getV3EncryptedWallets()
  return !!wallets.length
}

interface WalletMap {
  [Chain.BTC]: BtcWallet
  [Chain.MVC]: MvcWallet
}

type SupportedChain = Chain.BTC | Chain.MVC

export async function getCurrentWallet<T extends SupportedChain>(
  chain: T,
  options?: {
    mnemonic?: string
    password?: string
    addressIndex?: number
  }
): Promise<T extends Chain.BTC ? BtcWallet : MvcWallet> {
  const network = getNet()
  const activeWallet = await getActiveWalletOnlyAccount()
  let mnemonic = options?.mnemonic
  if (!mnemonic) {
    const password = options?.password || (await getPassword())
    mnemonic = decrypt(activeWallet.mnemonic, password)
  }
  const addressIndex = options?.addressIndex ?? activeWallet.accounts[0].addressIndex
  const addressType = await getV3AddressTypeStorage(chain)
  if (chain === Chain.BTC) {
    const coinType = addressType === AddressType.SameAsMvc ? activeWallet.mvcTypes[0] : CoinType.BTC
    return new BtcWallet({ coinType, addressType, addressIndex, network, mnemonic }) as any
  } else if (chain === Chain.MVC) {
    const coinType = activeWallet.mvcTypes[0]
    return new MvcWallet({ coinType, addressType, addressIndex, network, mnemonic }) as any
  } else {
    throw new Error(`Chain ${chain} is not supported`)
  }
}

export async function deleteV3Wallet(walletId: string) {
  const walletsMap = await getV3EncryptedWalletsStorage()
  if (!walletsMap) {
    throw new Error('V3 wallets storage not found.')
  }
  delete walletsMap[walletId]
  await setV3EncryptedWalletsStorage(walletsMap)
}
