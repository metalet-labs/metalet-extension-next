import { reactive } from 'vue'
import { getNet } from '@/lib/network'
import { goToPage } from '@/lib/utils'
import { type Net } from 'utxo-wallet-sdk'
import { WalletManager } from 'utxo-wallet-service'
import { getCurrentAccountId } from '@/lib/account'
import { getV3Wallets, getV3CurrentWallet, getCurrentWalletId } from '@/lib/wallet'

let walletManager: WalletManager | null = null

const getWalletManager = async (): Promise<WalletManager> => {
  if (!walletManager) {
    const network = getNet() as Net
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

    walletManager = new WalletManager({
      network,
      walletsOptions,
    })
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
  const currentAccountId = await getCurrentAccountId()
  const currentWalletId = await getCurrentWalletId()
  if (!currentAccountId || !currentWalletId) {
    goToPage('/manage/wallets')
    throw new Error('No current account id or wallet id found')
  }
  return getWalletManager().then((manager) => {
    return manager.getAccountChainWallets(currentWalletId, currentAccountId) 
  })
}

export const WalletsStore = reactive({
  getWalletManager,
  loadOtherAccounts,
  getAccountChainWallets,
})
