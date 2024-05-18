<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { PasswordInput } from '@/components'
import { toast } from '@/components/ui/toast'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const phase = ref<1 | 2>(1)

passwordManager.has().then((_hasPassword) => {
  if (!_hasPassword) {
    phase.value = 2
  }
})

const error = ref('')
const password = ref('')
const confirmPassword = ref('')

const canPass = computed(() => {
  return password.value.length >= 8
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
    const isCorrect = await passwordManager.check(password.value)
    if (isCorrect) {
      password.value = ''
      error.value = ''
      phase.value = 2
    } else {
      error.value = 'Incorrect password. Try again.'
    }
  } else {
    if (password.value !== confirmPassword.value) {
      error.value = "Passwords don't match. Try again."
    } else {
      await passwordManager.set(password.value)
      toast({ title: 'Set Password successfully.', toastType: 'success' })
      router.push('/wallet')
    }
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="h-15 -my-3 flex items-center gap-3">
      <ChevronLeftIcon class="w-6 h-6 cursor-pointer" @click="back" />
    </div>
    <div class="space-y-2 pt-4">
      <h3 class="text-2xl font-medium">Change Password</h3>
      <p class="mt-2 text-sm text-gray-primary">
        Set a password to manage your wallet. Note thatwe don't store your password and can't restore it for you. If you
        forget your password, you can set anew one by resetting your wallet and re-importing it.
      </p>
    </div>
    <div class="grow">
      <PasswordInput
        v-if="phase === 1"
        v-model:password="password"
        title="Old Password"
        v-model:error="error"
        class="mt-9"
      />

      <div v-if="phase === 2" class="mt-9 space-y-9">
        <PasswordInput v-model:password="password" title="New Password" :validate="true" />
        <PasswordInput v-model:password="confirmPassword" title="Confirm" v-model:error="error" />
      </div>
    </div>
    <div class="flex items-center justify-center gap-2 my-6">
      <button class="w-30 h-12 bg-blue-light rounded-3xl text-blue-primary" @click="back">Back</button>
      <button
        class="w-30 h-12 bg-blue-primary rounded-3xl text-white"
        :class="!canPass && 'opacity-50 cursor-not-allowed'"
        :disabled="!canPass"
        @click="next"
      >
        Next
      </button>
    </div>
  </div>
</template>
