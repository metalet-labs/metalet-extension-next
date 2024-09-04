import { reactive } from 'vue'
import { getNet } from '@/lib/network'
import { toast } from '@/components/ui/toast'
import { getCurrentAccountId } from '@/lib/account'
import { getV3AddressTypeStorage } from '@/lib/addressType'
import { WalletManager } from '@metalet/utxo-wallet-service'
import { Chain, type Net } from '@metalet/utxo-wallet-service'
import {
  getCurrentWalletId,
  getWalletOnlyAccount,
  getWalletOtherAccounts,
  getActiveWalletOnlyAccount,
  getActiveWalletOtherAccounts,
} from '@/lib/wallet'
import { getPassword } from '@/lib/lock'
import { decrypt } from '@/lib/crypto'

let walletManager: WalletManager | null = null

// TODO: Execute it only once.
const initWalletManager = async (): Promise<WalletManager> => {
  if (walletManager) {
    return walletManager
  }
  try {
    const password = await getPassword()
    const activeWallet = await getActiveWalletOnlyAccount()
    const walletsOptions = [
      {
        id: activeWallet.id,
        name: activeWallet.name,
        mvcTypes: activeWallet.mvcTypes,
        mnemonic: decrypt(activeWallet.mnemonic, password),
        accountsOptions: activeWallet.accounts.map(({ id, name, addressIndex }) => ({ id, name, addressIndex })),
      },
    ]
    const network = getNet() as Net
    walletManager = new WalletManager({ network, walletsOptions })
    loadActiveWalletOtherAccounts()
    return walletManager
  } catch (err) {
    toast({ title: (err as Error).message, toastType: 'fail' })
    throw err
  }
}

const hasWalletManager = () => {
  return walletManager !== null
}

const resetManager = () => {
  walletManager = null
}

const getWalletManager = async (): Promise<WalletManager> => {
  if (!walletManager) {
    walletManager = await initWalletManager()
  }
  return walletManager
}

// TODO: Execute it only once.
const loadActiveWalletOtherAccounts = async () => {
  const manager = await getWalletManager()
  const activeWallet = await getActiveWalletOtherAccounts()
  if (!activeWallet) {
    throw new Error('No active wallet found. Please select a wallet.')
  }
  for (let account of activeWallet.accounts) {
    manager.addAccount(activeWallet.id, {
      id: account.id,
      name: account.name,
      addressIndex: account.addressIndex,
    })
  }
}

const loadWalletOtherAccounts = async (walletId: string, accountId: string) => {
  const manager = await getWalletManager()
  const wallet = await getWalletOtherAccounts(walletId, accountId)
  if (!wallet) {
    throw new Error('No wallet found. Please select a wallet.')
  }
  for (let account of wallet.accounts) {
    manager.addAccount(wallet.id, {
      id: account.id,
      name: account.name,
      addressIndex: account.addressIndex,
    })
  }
}

const getAccountChainWallets = async () => {
  try {
    const currentWalletId = await getCurrentWalletId()
    if (!currentWalletId) {
      throw new Error('No current wallet found. Please select a wallet.')
    }

    const currentAccountId = await getCurrentAccountId()
    if (!currentAccountId) {
      throw new Error('No current account found. Please select an account.')
    }

    const walletManager = await getWalletManager()
    return walletManager.getAccountChainWallets(currentWalletId, currentAccountId) || []
  } catch (error) {
    console.error('Error getting account chain wallets:', error)
    throw error
  }
}

const getCurrentChainWallet = async (chain: Chain) => {
  const accountChainWallets = await getAccountChainWallets()
  const chainWallets = accountChainWallets[chain]
  if (!chainWallets) {
    throw new Error('No chain wallets found.')
  }
  const addressType = await getV3AddressTypeStorage(chain)
  const chainWallet = chainWallets.find((wallet) => wallet.getAddressType() === addressType)
  if (!chainWallet) {
    throw new Error(`No ${addressType} wallet found.`)
  }
  return chainWallet
}

const addWalletOnlyAccount = async (walletId: string, accountId: string) => {
  const password = await getPassword()
  const manager = await getWalletManager()
  const wallet = await getWalletOnlyAccount(walletId, accountId)
  manager.addWallet({
    id: wallet.id,
    name: wallet.name,
    mvcTypes: wallet.mvcTypes,
    mnemonic: decrypt(wallet.mnemonic, password),
    accountsOptions: wallet.accounts.map(({ id, name, addressIndex }) => ({ id, name, addressIndex })),
  })
}

const getWallets = async () => {
  const manager = await getWalletManager()
  return manager.getWallets()
}

const loadAccount = async (
  walletId: string,
  account: {
    id: string
    name: string
    addressIndex: number
  }
) => {
  const manager = await getWalletManager()
  manager.addAccount(walletId, account)
}

export const WalletsStore = reactive({
  getWallets,
  loadAccount,
  resetManager,
  getWalletManager,
  hasWalletManager,
  initWalletManager,
  addWalletOnlyAccount,
  getCurrentChainWallet,
  getAccountChainWallets,
  loadWalletOtherAccounts,
})
