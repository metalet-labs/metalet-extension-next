import { FEEB } from '@/data/config'
import { network } from '@/lib/network'
import { createGlobalState } from '@vueuse/core'
import { getCurrentWalletId } from '@/lib/wallet'
import { WalletsStore } from '@/stores/WalletStore'
import { getCurrentAccountId } from '@/lib/account'
import { onMounted, ref, toRaw, computed } from 'vue'
import { API_NET, API_TARGET, Wallet } from 'meta-contract'
import { BtcWallet, Chain, MvcWallet, DogeWallet } from '@metalet/utxo-wallet-service'

export const useChainWalletsStore = createGlobalState(() => {
  const currentBTCWallet = ref<BtcWallet>()
  const currentMVCWallet = ref<MvcWallet>()
  const currentDOGEWallet = ref<DogeWallet>()

  const updateWallet = async (chain: Chain) => {
    if (chain === Chain.BTC) {
      currentBTCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.BTC) as BtcWallet | undefined
    } else if (chain === Chain.MVC) {
      currentMVCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.MVC) as MvcWallet | undefined
    } else if (chain === Chain.DOGE) {
      currentDOGEWallet.value = await WalletsStore.getCurrentChainWallet(Chain.DOGE) as DogeWallet | undefined
    } else {
      throw new Error('Invalid chain')
    }
  }

  const updateAllWallets = async () => {
    try {
      const btcWallet = await WalletsStore.getCurrentChainWallet(Chain.BTC) as BtcWallet | undefined
      currentBTCWallet.value = btcWallet

      const mvcWallet = await WalletsStore.getCurrentChainWallet(Chain.MVC) as MvcWallet | undefined
      currentMVCWallet.value = mvcWallet

      const dogeWallet = await WalletsStore.getCurrentChainWallet(Chain.DOGE) as DogeWallet | undefined
      currentDOGEWallet.value = dogeWallet
    } catch (error) {
      console.error('Error updating wallets:', error)
    }
  }

  const getAddress = (chain: Chain) => {
    if (chain === Chain.BTC) {
      return computed(() => toRaw(currentBTCWallet.value)?.getAddress() || '')
    } else if (chain === Chain.MVC) {
      return computed(() => toRaw(currentMVCWallet.value)?.getAddress() || '')
    } else if (chain === Chain.DOGE) {
      return computed(() => toRaw(currentDOGEWallet.value)?.getAddress() || '')
    } else {
      throw new Error('Invalid chain')
    }
  }

  const initMvcWallet = (feeb=FEEB) => {
    const wif = toRaw(currentMVCWallet.value!).getPrivateKey()
    return new Wallet(wif, network.value as API_NET, feeb, API_TARGET.APIMVC)
  }

  onMounted(async () => {
    const currentWalletId = await getCurrentWalletId()
    const currentAccountId = await getCurrentAccountId()
    if (currentWalletId && currentAccountId) {
      currentBTCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.BTC) as BtcWallet | undefined
      currentMVCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.MVC) as MvcWallet | undefined
      currentDOGEWallet.value = await WalletsStore.getCurrentChainWallet(Chain.DOGE) as DogeWallet | undefined
    }
  })

  return {
    getAddress,
    updateWallet,
    initMvcWallet,
    updateAllWallets,
    currentBTCWallet: computed(() => toRaw(currentBTCWallet.value)),
    currentMVCWallet: computed(() => toRaw(currentMVCWallet.value)),
    currentDOGEWallet: computed(() => toRaw(currentDOGEWallet.value)),
  }
})
