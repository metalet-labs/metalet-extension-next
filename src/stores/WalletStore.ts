import { reactive } from 'vue'
import { getNet } from '@/lib/network'
import { toast } from '@/components/ui/toast'
import { goToPage, goToTab } from '@/lib/utils'
import { getCurrentAccountId } from '@/lib/account'
import { getV3AddressTypeStorage } from '@/lib/addressType'
import { WalletManager } from '@metalet/utxo-wallet-service'
import { Chain, type Net } from '@metalet/utxo-wallet-service'
import {
  hasV3Wallets,
  getCurrentWalletId,
  getInactiveWallets,
  getActiveWalletOnlyAccount,
  getActiveWalletOtherAccounts,
} from '@/lib/wallet'

let walletManager: WalletManager | null = null

const initWalletManager = async (): Promise<WalletManager> => {
  try {
    const activeWallet = await getActiveWalletOnlyAccount()
    const walletsOptions = [
      {
        id: activeWallet.id,
        mnemonic: activeWallet.mnemonic,
        name: activeWallet.name,
        mvcTypes: activeWallet.mvcTypes,
        accountsOptions: activeWallet.accounts.map(({ id, name, addressIndex }) => ({ id, name, addressIndex })),
      },
    ]
    const network = getNet() as Net
    walletManager = new WalletManager({ network, walletsOptions })
    loadOtherAccounts()
    return walletManager
  } catch (err) {
    toast({ title: (err as Error).message, toastType: 'fail' })
    if (await hasV3Wallets()) {
      goToPage('/manage/wallets')
    } else {
      goToTab('/welcome', true)
    }
    throw err
  }
}

const hasWalletManager = () => {
  return walletManager !== null
}

const getWalletManager = async (): Promise<WalletManager> => {
  if (!walletManager) {
    walletManager = await initWalletManager()
  }
  return walletManager
}

const loadOtherAccounts = async () => {
  const manager = await getWalletManager()
  const activeWallet = await getActiveWalletOtherAccounts()
  if (!activeWallet) {
    if (await hasV3Wallets()) {
      goToPage('/manage/wallets')
    } else {
      goToTab('/welcome', true)
    }
    return
  }
  for (let account of activeWallet.accounts) {
    manager.addAccount(activeWallet.id, {
      id: account.id,
      name: account.name,
      addressIndex: account.addressIndex,
    })
  }
  const inactiveWallets = await getInactiveWallets()
  for (let wallet of inactiveWallets) {
    manager.addWallet({
      id: wallet.id,
      name: wallet.name,
      mnemonic: wallet.mnemonic,
      mvcTypes: wallet.mvcTypes,
      accountsOptions: wallet.accounts.map(({ id, name, addressIndex }) => ({ id, name, addressIndex })),
    })
  }
}

const getAccountChainWallets = async () => {
  try {
    const currentWalletId = await getCurrentWalletId()

    if (!currentWalletId) {
      goToPage('/manage/wallets')
      throw new Error('No current wallet found. Please select a wallet.')
    }

    const currentAccountId = await getCurrentAccountId()
    if (!currentAccountId) {
      goToPage('/manage/wallets')
      throw new Error('No current account found. Please select an account.')
    }

    const walletManager = await getWalletManager()
    return walletManager.getAccountChainWallets(currentWalletId, currentAccountId)
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

export const WalletsStore = reactive({
  getWalletManager,
  hasWalletManager,
  initWalletManager,
  getAccountChainWallets,
  getCurrentChainWallet,
})
