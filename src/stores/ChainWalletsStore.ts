import { FEEB } from '@/data/config'
import { network } from '@/lib/network'
import { createGlobalState } from '@vueuse/core'
import { WalletsStore } from '@/stores/WalletStore'
import { onMounted, ref, toRaw, computed } from 'vue'
import { API_NET, API_TARGET, Wallet } from 'meta-contract'
import { BtcWallet, Chain, MvcWallet } from '@metalet/utxo-wallet-service'

export const useChainWalletsStore = createGlobalState(() => {
  const currentBTCWallet = ref<BtcWallet>()
  const currentMVCWallet = ref<MvcWallet>()

  const updataWallet = async (chain: Chain) => {
    if (chain === Chain.BTC) {
      currentBTCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.BTC)
    } else if (chain === Chain.MVC) {
      currentMVCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.MVC)
    } else {
      throw new Error('Invalid chain')
    }
  }

  const getAddress = (chain: Chain) => {
    if (chain === Chain.BTC) {
      return computed(() => toRaw(currentBTCWallet.value)?.getAddress() || '')
    } else if (chain === Chain.MVC) {
      return computed(() => toRaw(currentMVCWallet.value)?.getAddress() || '')
    } else {
      throw new Error('Invalid chain')
    }
  }

  const initMvcWallet = () => {
    const wif = toRaw(currentMVCWallet.value!).getPrivateKey()
    return new Wallet(wif, network.value as API_NET, FEEB, API_TARGET.MVC)
  }

  onMounted(async () => {
    currentBTCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.BTC)
    currentMVCWallet.value = await WalletsStore.getCurrentChainWallet(Chain.MVC)
  })

  return {
    currentBTCWallet: computed(() => toRaw(currentBTCWallet.value)),
    currentMVCWallet: computed(() => toRaw(currentMVCWallet.value)),
    getAddress,
    updataWallet,
    initMvcWallet,
  }
})
