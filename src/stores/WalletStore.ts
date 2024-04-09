import { reactive } from 'vue'
import { getNet } from '@/lib/network'
import { goToPage } from '@/lib/utils'
import { getCurrentAccountId } from '@/lib/account'
import { getV3AddressTypeStorage } from '@/lib/addressType'
import { Chain, type Net } from '@metalet/utxo-wallet-service'
import { WalletManager, type WalletOptions } from '@metalet/utxo-wallet-service'
import { getV3Wallets, getV3CurrentWallet, getCurrentWalletId } from '@/lib/wallet'

let walletManager: WalletManager | null = null

const initWalletManager = (walletsOptions: WalletOptions[]): WalletManager => {
  const network = getNet() as Net
  walletManager = new WalletManager({ network, walletsOptions })
  return walletManager
}

const hasWalletManager = () => {
  return walletManager !== null
}

const getWalletManager = async (): Promise<WalletManager> => {
  if (!walletManager) {
    const currentWallet = await getV3CurrentWallet()
    if (!currentWallet) {
      const wallets = await getV3Wallets()
      if (wallets.length) {
        goToPage('/manage/wallets')
      } else {
        goToPage('/welcome', true)
      }
      throw new Error('No current wallet found')
    }

    const walletsOptions = [
      {
        id: currentWallet.id,
        mnemonic: currentWallet.mnemonic,
        name: currentWallet.name,
        mvcTypes: currentWallet.mvcTypes,
        accountsOptions: currentWallet.accounts.map((account) => ({
          id: account.id,
          addressIndex: account.addressIndex,
          name: account.name,
        })),
      },
    ]
    walletManager = initWalletManager(walletsOptions)
  }
  return walletManager
}

const loadOtherAccounts = async () => {
  const manager = await getWalletManager()
  const wallets = await getV3Wallets()
  const currentWallet = await getV3CurrentWallet()
  const currentAccountId = await getCurrentAccountId()
  if (!currentWallet || !currentAccountId) {
    const wallets = await getV3Wallets()
    if (wallets.length) {
      goToPage('/manage/wallets')
    } else {
      goToPage('/welcome', true)
    }
    return
  }
  const accounts = currentWallet.accounts.filter((account) => account.id !== currentAccountId)
  for (let account of accounts) {
    manager.addAccount(currentWallet.id, {
      id: account.id,
      name: account.name,
      addressIndex: account.addressIndex,
    })
  }
  const otherWallets = wallets.filter((wallet) => wallet.id !== currentWallet.id)
  for (let wallet of otherWallets) {
    manager.addWallet({
      id: wallet.id,
      name: wallet.name,
      mnemonic: wallet.mnemonic,
      mvcTypes: wallet.mvcTypes,
      accountsOptions: wallet.accounts.map((account) => ({
        addressIndex: account.addressIndex,
        name: account.name,
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
  loadOtherAccounts,
  getAccountChainWallets,
  getCurrentChainWallet,
})
