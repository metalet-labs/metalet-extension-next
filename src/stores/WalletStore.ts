import { reactive } from 'vue'
import { getNet } from '@/lib/network'
import { type Net } from 'utxo-wallet-sdk'
import { getV3Wallets } from '@/lib/wallet'
import { WalletManager } from 'utxo-wallet-service'

let walletManager: WalletManager | undefined

const initWalletManager = async () => {
  if (!walletManager) {
    const network = getNet() as Net
    const wallets = await getV3Wallets()
    const walletsOptions = wallets.map((wallet) => ({
      mnemonic: wallet.mnemonic,
      name: wallet.name,
      mvcTypes: wallet.mvcTypes,
      accountsOptions: wallet.accounts.map((account) => ({
        addressIndex: account.addressIndex,
        name: account.name,
      })),
    }))

    walletManager = new WalletManager({
      network,
      walletsOptions,
    })
  }
}

export const WalletsStore = reactive({
  walletManager,
  initWalletManager,
})
