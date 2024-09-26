<script lang="ts" setup>
import hash from 'object-hash'
import { computed, ref } from 'vue'
import { IS_DEV } from '@/data/config'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { PasswordInput } from '@/components'
import { toast } from '@/components/ui/toast'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { decrypt, encrypt, hashWithSha256 } from '@/lib/crypto'
import {
  backupV3EncryptedWalletsStorage,
  getV3EncryptedWalletsStorage,
  setV3EncryptedWalletsStorage,
} from '@/lib/wallet'

const router = useRouter()
const phase = ref<1 | 2>(1)
const hasPassword = ref(true)

passwordManager.has().then((_hasPassword) => {
  hasPassword.value = _hasPassword
  if (!_hasPassword) {
    phase.value = 2
  }
})

const error = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const canPass = computed(() => {
  return (
    (oldPassword.value.length >= 6 && phase.value === 1) ||
    (newPassword.value.length >= 6 && confirmPassword.value.length >= 6 && phase.value === 2)
  )
})

// 按钮
const back = () => {
  if (phase.value === 1) {
    router.back()
  } else {
    phase.value = 1
  }
}

const next = async () => {
  if (phase.value === 1) {
    const isCorrect = await passwordManager.check(oldPassword.value)
    if (isCorrect) {
      error.value = ''
      phase.value = 2
    } else {
      error.value = 'Incorrect password. Try again.'
    }
  } else {
    if (newPassword.value === oldPassword.value) {
      error.value = "New password can't be the same as old password."
    } else if (newPassword.value.length < 6) {
      error.value = 'Password must be at least 6 characters long.'
    } else if (newPassword.value !== confirmPassword.value) {
      error.value = "Passwords don't match. Try again."
    } else {
      await backupV3EncryptedWalletsStorage()
      const wallets = await getV3EncryptedWalletsStorage()
      try {
        for (const key in wallets) {
          if (wallets.hasOwnProperty(key)) {
            let password = IS_DEV ? hashWithSha256(oldPassword.value) : hash(oldPassword.value)
            const mnemonic = decrypt(wallets[key].mnemonic, password)
            password = IS_DEV ? hashWithSha256(newPassword.value) : hash(newPassword.value)
            wallets[key].mnemonic = encrypt(mnemonic, password)
          }
        }
      } catch (e: any) {
        toast({ title: 'Set Password failed.', toastType: 'fail', description: e.message })
        return
      }

      await setV3EncryptedWalletsStorage(wallets)
      await passwordManager.set(newPassword.value)
      toast({ title: 'Set Password successfully.', toastType: 'success' })
      router.push('/wallet')
    }
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="h-15 -my-3 flex items-center gap-3" v-if="hasPassword">
      <ChevronLeftIcon class="w-6 h-6 cursor-pointer" @click="$router.back()" />
    </div>
    <div class="space-y-2 pt-4">
      <h3 class="text-2xl font-medium">
        {{ hasPassword ? $t('SetPasswordPage.ChangePassword') : $t('SetPasswordPage.SetPassword') }}
      </h3>
      <p class="mt-2 text-sm text-gray-primary">
        {{ $t('SetPasswordPage.SetPasswordTips') }}
      </p>
    </div>
    <div class="grow">
      <PasswordInput
        v-if="phase === 1"
        v-model:password="oldPassword"
        :title="$t('SetPasswordPage.OldPassword')"
        v-model:error="error"
        class="mt-9"
      />

      <div v-if="phase === 2" class="mt-9 space-y-9">
        <PasswordInput v-model:password="newPassword" :title="$t('SetPasswordPage.OldPassword')" :validate="true" />
        <PasswordInput v-model:password="confirmPassword" :title="$t('Common.Confirm')" v-model:error="error" />
      </div>
    </div>
    <div class="flex items-center justify-center gap-2 my-6">
      <button class="w-30 h-12 bg-blue-light rounded-3xl text-blue-primary" @click="back">
        {{ $t('Common.Back') }}
      </button>
      <button
        class="w-30 h-12 bg-blue-primary rounded-3xl text-white"
        :class="!canPass && 'opacity-50 cursor-not-allowed'"
        :disabled="!canPass"
        @click="next"
      >
        {{ $t('Common.Continue') }}
      </button>
    </div>
  </div>
</template>
