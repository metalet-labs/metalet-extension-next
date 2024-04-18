import { reactive } from 'vue'
import { getNet } from '@/lib/network'
import { goToPage } from '@/lib/utils'
import { getCurrentAccountId } from '@/lib/account'
import { getV3AddressTypeStorage } from '@/lib/addressType'
import { WalletManager } from '@metalet/utxo-wallet-service'
import { Chain, type Net } from '@metalet/utxo-wallet-service'
import { getV3Wallets, getActiveWalletAccount, getCurrentWalletId, hasV3Wallets } from '@/lib/wallet'
import { toast } from '@/components/ui/toast'

let walletManager: WalletManager | null = null

const initWalletManager = async (): Promise<WalletManager> => {
  try {
    const activeWallet = await getActiveWalletAccount()
    const walletsOptions = [
      {
        id: activeWallet.id,
        mnemonic: activeWallet.mnemonic,
        name: activeWallet.name,
        mvcTypes: activeWallet.mvcTypes,
        accountsOptions: activeWallet.accounts.map(({ id, name, addressIndex }) => ({
          id,
          name,
          addressIndex,
        })),
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
      goToPage('/welcome', true)
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
  const wallets = await getV3Wallets()
  const activeWallet = await getActiveWalletAccount()
  const currentAccountId = await getCurrentAccountId()
  if (!activeWallet || !currentAccountId) {
    const wallets = await getV3Wallets()
    if (wallets.length) {
      goToPage('/manage/wallets')
    } else {
      goToPage('/welcome', true)
    }
    return
  }
  const accounts = activeWallet.accounts.filter((account) => account.id !== currentAccountId)
  for (let account of accounts) {
    manager.addAccount(activeWallet.id, {
      id: account.id,
      name: account.name,
      addressIndex: account.addressIndex,
    })
  }
  const otherWallets = wallets.filter((wallet) => wallet.id !== activeWallet.id)
  for (let wallet of otherWallets) {
    manager.addWallet({
      id: wallet.id,
      name: wallet.name,
      mnemonic: wallet.mnemonic,
      mvcTypes: wallet.mvcTypes,
      accountsOptions: wallet.accounts.map((account) => ({
        id: account.id,
        name: account.name,
        addressIndex: account.addressIndex,
      })),
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
    throw new Error('No chain wallet found.')
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
