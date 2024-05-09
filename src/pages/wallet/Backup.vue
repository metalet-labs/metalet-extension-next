<script lang="ts" setup>
import { Ref, ref } from 'vue'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { toast } from '@/components/ui/toast'
import { EyeIcon } from '@heroicons/vue/24/solid'
import ResetModal from '@/components/ResetModal.vue'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { getCurrentWalletId, getV3CurrentWallet } from '@/lib/wallet'
import { PasswordInput, SeedPhrase, VerifySeedPhrase } from '@/components'
import { getBackupV3Wallet, hasBackupCurrentWallet, setBackupV3Wallet } from '@/lib/backup'

const router = useRouter()
const { currentMVCWallet } = useChainWalletsStore()

const mnemonic = ref()
const showResetModal = ref(false)
const verifySeedPhrase = ref<typeof VerifySeedPhrase>()

getV3CurrentWallet().then((_wallet) => {
  mnemonic.value = _wallet.mnemonic
})

const error = ref('')
const password = ref('')
const phase: Ref<1 | 2 | 3> = ref(1)

const isCoveredMne = ref(true)

const next = async () => {
  if (phase.value === 1) {
    const isCorrect = await passwordManager.check(password.value)
    if (isCorrect) {
      phase.value = 2
    } else {
      error.value = 'Incorrect password. Try again.'
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
          title: 'Backup Success',
          description: 'Your wallet has been backed up successfully',
          toastType: 'success',
        })
        router.push('/wallet')
      }
    } else {
      error.value = 'Incorrect seed phrase. Try again.'
    }
  }
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <!-- TODO: put into secondary-header -->
    <div class="grid grid-cols-5 items-center h-15">
      <div class="col-span-1 flex items-center">
        <button @click="phase === 1 ? $router.back() : (phase -= 1)">
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
          <h3 class="mt-4 text-2xl font-medium">Backup Mnemonic Phrase</h3>
          <p class="mt-2 text-sm text-gray-primary">
            Please enter the wallet password. After verification, you can backup the wallet mnemonic phrase.
          </p>
        </div>
        <PasswordInput v-model:password="password" v-model:error="error" class="mt-12" />
      </template>

      <div v-else-if="phase === 2" class="space-y-8">
        <div class="pt-4 space-y-2">
          <h3 class="text-2xl font-medium">Please note down the mnemonic phrase below.</h3>
          <p class="text-sm text-gray-primary">
            Internet-connected devices might leak information. We strongly encourage you to backup the mnemonic phrase
            by writing it down on paper and keeping it safe.
          </p>
        </div>
        <div class="relative mt-2">
          <SeedPhrase :words="mnemonic.split(' ')" :edit="false" :noCopied="true" />
          <div
            v-if="isCoveredMne"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-lg bg-gray-100/30 backdrop-blur"
          >
            <button
              class="w- flex w-32 items-center justify-center gap-x-2 rounded-full border border-black py-2"
              @click="isCoveredMne = false"
            >
              <EyeIcon class="h-5 w-5" />
              <span>Show</span>
            </button>
            <div class="w-64 text-center">
              Click to view your Mnemonic Phrase. Please ensure that no one else is watching your screen at this time.
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <h4>MVC Derivation Path</h4>
          <div class="rounded-lg bg-gray-100 px-3 py-2 text-sm leading-loose">{{ currentMVCWallet?.getPath() }}</div>
        </div>
      </div>

      <div v-else-if="phase === 3">
        <div class="pt-4 space-y-2">
          <h3 class="text-2xl font-medium">Please Verify Your Mnemonic Phrase Again</h3>
          <p class="text-sm text-gray-primary">Please fill in your mnemonic phrase according to the sequence number.</p>
        </div>
        <VerifySeedPhrase ref="verifySeedPhrase" :randomNum="4" :words="mnemonic.split(' ')" class="mt-8" />
      </div>
    </div>

    <!-- buttons -->
    <div class="flex flex-col items-center justify-center py-5 relative">
      <button
        @click="next"
        :disabled="!password"
        :class="[
          'bg-blue-primary w-61.5 h-12 rounded-3xl py-4 text-ss leading-none text-white',
          !password && 'opacity-50 saturate-50 cursor-not-allowed',
        ]"
      >
        {{ phase !== 3 ? 'Next' : 'Confirm' }}
      </button>
      <button @click="showResetModal = true" class="mt-4 text-ss text-gray-primary" v-if="phase === 1">
        Forget password?
      </button>
      <p v-if="error" class="absolute bottom-[100%] left-0 text-sm text-red-500 text-center w-full">{{ error }}</p>
    </div>
    <ResetModal v-model:show="showResetModal" />
  </div>
</template>
