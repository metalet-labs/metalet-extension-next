/**
 * DOGE Wallet Store
 * 
 * Manages the current DOGE wallet state separately from BTC/MVC
 * since DOGE uses a custom wallet implementation
 */

import { ref, computed, toRaw } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { DogeWallet } from '@/lib/doge/wallet'
import { getDogeWallet } from '@/lib/actions/doge/wallet'
import { getCurrentWalletId } from '@/lib/wallet'
import { getCurrentAccountId } from '@/lib/account'

export const useDogeWalletStore = createGlobalState(() => {
  const currentDogeWallet = ref<DogeWallet | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  /**
   * Update/Initialize the DOGE wallet
   */
  const updateWallet = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      currentDogeWallet.value = await getDogeWallet()
      isInitialized.value = true
    } catch (e: any) {
      error.value = e.message || 'Failed to load DOGE wallet'
      console.error('Error updating DOGE wallet:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get DOGE address
   */
  const address = computed(() => {
    const wallet = toRaw(currentDogeWallet.value)
    return wallet?.getAddress() || ''
  })

  /**
   * Get DOGE public key
   */
  const publicKey = computed(() => {
    const wallet = toRaw(currentDogeWallet.value)
    return wallet?.getPublicKeyHex() || ''
  })

  /**
   * Initialize wallet if not already done
   */
  const init = async () => {
    if (isInitialized.value || isLoading.value) return
    
    const currentWalletId = await getCurrentWalletId()
    const currentAccountId = await getCurrentAccountId()
    
    if (currentWalletId && currentAccountId) {
      await updateWallet()
    }
  }

  // Auto-initialize on first access
  init()

  return {
    currentDogeWallet: computed(() => toRaw(currentDogeWallet.value)),
    address,
    dogeAddress: address,
    publicKey,
    dogePublicKey: publicKey,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isInitialized: computed(() => isInitialized.value),
    updateWallet,
    init,
  }
})
