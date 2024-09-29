<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { PasswordInput } from '@/components'
import { toast } from '@/components/ui/toast'

const error = ref('')
const router = useRouter()
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const canPass = computed(() => {
  return newPassword.value.length >= 6 && confirmPassword.value.length >= 6
})

const next = async () => {
  if (newPassword.value === oldPassword.value) {
    error.value = "New password can't be the same as old password."
  } else if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters long.'
  } else if (newPassword.value !== confirmPassword.value) {
    error.value = "Passwords don't match. Try again."
  } else {
    await passwordManager.set(newPassword.value)
    toast({ title: 'Set Password successfully.', toastType: 'success' })
    router.push('/wallet')
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="space-y-2 pt-4">
      <h3 class="text-2xl font-medium">
        {{ $t('SetPasswordPage.SetPassword') }}
      </h3>
      <p class="mt-2 text-sm text-gray-primary">
        {{ $t('SetPasswordPage.SetPasswordTips') }}
      </p>
    </div>
    <div class="grow">
      <div class="mt-9 space-y-9">
        <PasswordInput v-model:password="newPassword" :title="$t('Common.Password')" :validate="true" />
        <PasswordInput v-model:password="confirmPassword" :title="$t('Common.Confirm')" v-model:error="error" />
      </div>
    </div>
    <div class="flex items-center justify-center gap-2 my-6">
      <button
        class="w-61.5 h-12 bg-blue-primary rounded-3xl text-white"
        :class="!canPass && 'opacity-50 cursor-not-allowed'"
        :disabled="!canPass"
        @click="next"
      >
        {{ $t('Common.Confirm') }}
      </button>
    </div>
  </div>
</template>
