<script lang="ts" setup>
import { computed, Ref, ref } from 'vue'
import { IS_DEV } from '@/data/config'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { toast } from '@/components/ui/toast'
import { EyeIcon } from '@heroicons/vue/24/solid'
import ResetModal from '@/components/ResetModal.vue'
import { decrypt, hashWithSha256 } from '@/lib/crypto'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { getCurrentWalletId, getV3CurrentWallet } from '@/lib/wallet'
import { PasswordInput, SeedPhrase, VerifySeedPhrase } from '@/components'
import { getBackupV3Wallet, hasBackupCurrentWallet, setBackupV3Wallet } from '@/lib/backup'

const router = useRouter()

const error = ref('')
const wallet = ref()
const password = ref('')
const isCoveredMne = ref(true)
const showResetModal = ref(false)
const phase: Ref<1 | 2 | 3> = ref(1)
const verifySeedPhrase = ref<typeof VerifySeedPhrase>()

getV3CurrentWallet().then((_wallet) => {
  wallet.value = _wallet
})

const mnemonic = computed(() => {
  if (wallet.value && password) {
    return decrypt(wallet.value.mnemonic, IS_DEV ? hashWithSha256(password.value) : password.value)
  }
  return ''
})


const next = async () => {
  if (phase.value === 1) {
    const isCorrect = await passwordManager.check(password.value)
    if (isCorrect) {
      phase.value = 2
      error.value = ''
    } else {
      error.value = 'Incorrect. Try again.'
      return
    }
  } else if (phase.value === 2) {
    phase.value += 1
  } else if (phase.value === 3) {
    if (verifySeedPhrase.value?.confirm()) {
      if (await hasBackupCurrentWallet()) {
        router.push('/wallet')
      } else {
        const walletIds = await getBackupV3Wallet()
        const currentWalletId = (await getCurrentWalletId()) as string
        walletIds.push(currentWalletId)
        await setBackupV3Wallet(walletIds)
        toast({
          title: 'Backed up successfully.',
          toastType: 'success',
        })
        router.push('/wallet')
      }
    } else {
      error.value = 'Incorrect seed phrase. Try again.'
    }
  }
}

const back = () => {
  error.value = ''
  phase.value -= 1
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <!-- TODO: put into secondary-header -->
    <div class="grid grid-cols-5 items-center h-15">
      <div class="col-span-1 flex items-center">
        <button @click="phase === 1 ? $router.back() : back()">
          <ChevronLeftIcon class="w-6 h-6" />
        </button>
      </div>
      <div class="col-span-3 justify-self-center text-base">
        <span>Backup</span>
      </div>
    </div>
    <div class="grow">
      <template v-if="phase === 1">
        <div class="pt-4 space-y-2">
          <h3 class="mt-4 text-2xl font-medium">Verify password</h3>
        </div>
        <PasswordInput v-model:password="password" v-model:error="error" class="mt-4" />
      </template>

      <div v-else-if="phase === 2" class="space-y-8">
        <div class="pt-4 space-y-2">
          <h3 class="text-2xl font-medium">Write down the words in order.</h3>
          <p class="text-sm text-gray-primary">Make sure the keep them stored safely.</p>
        </div>
        <div class="relative mt-2">
          <SeedPhrase :words="mnemonic.split(' ')" :edit="false" :noCopied="true" />
          <div v-if="isCoveredMne"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-lg bg-gray-100/30 backdrop-blur">
            <button class="w- flex w-32 items-center justify-center gap-x-2 rounded-full border border-black py-2"
              @click="isCoveredMne = false">
              <EyeIcon class="h-5 w-5" />
              <span>Show</span>
            </button>
            <div class="w-48 text-center">View your seed phrase. Make sure no one else is looking at your screen.</div>
          </div>
        </div>
      </div>

      <div v-else-if="phase === 3">
        <div class="pt-4 space-y-2">
          <h3 class="text-2xl font-medium">Verify your seed phrase</h3>
          <p class="text-sm text-gray-primary">Check if you remember these words from your seed phrase in order.</p>
        </div>
        <VerifySeedPhrase ref="verifySeedPhrase" :randomNum="4" :words="mnemonic.split(' ')" class="mt-8" />
      </div>
    </div>

    <!-- buttons -->
    <div class="flex flex-col items-center justify-center py-5 relative">
      <button @click="next" :disabled="!password" :class="[
        'bg-blue-primary w-61.5 h-12 rounded-3xl py-4 text-ss leading-none text-white',
        !password && 'opacity-50 saturate-50 cursor-not-allowed',
      ]">
        {{ [1, 3].includes(phase) ? 'Continue' : phase === 2 ? "OK, I've noted them down." : 'Confirm' }}
      </button>
      <button @click="showResetModal = true" class="mt-4 text-ss text-gray-primary" v-if="phase === 1">
        Forget password?
      </button>
    </div>
    <ResetModal v-model:show="showResetModal" />
  </div>
</template>
