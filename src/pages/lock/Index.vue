<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { PasswordInput } from '@/components'
import ResetModal from '@/components/ResetModal.vue'
import { setLastLockTime, unlock } from '@/lib/lock'
import MetaletLogo from '@/assets/images/metalet-logo-v3.svg?url'

const error = ref('')
const password = ref('')
const router = useRouter()
const showResetModal = ref(false)

const tryUnlock = async () => {
  const isCorrect = await passwordManager.check(password.value)
  if (isCorrect) {
    await unlock(password.value)
    await setLastLockTime()
    router.replace('/wallet')
  } else {
    error.value = 'Incorrect password. Try again.'
  }
}
</script>

<template>
  <div class="pt-20">
    <img class="mx-auto w-[130px]" :src="MetaletLogo" alt="metalet-logo" />

    <div class="mt-5 text-center">
      <h1 class="text-3xl font-extrabold">Metalet</h1>
      <p class="mt-2 text-sm text-gray-primary">{{ $t('LockPage.WelcomeBack') }}</p>
    </div>

    <form @submit.prevent="tryUnlock">
      <PasswordInput v-model:password="password" v-model:error="error" class="mt-12" />

      <div class="mt-14 flex flex-col items-center justify-center">
        <button
          type="submit"
          :class="[
            'bg-blue-primary w-61.5 rounded-3xl py-4 text-ss text-white',
            { 'opacity-50 cursor-not-allowed': !password },
          ]"
        >
          {{ $t('LockPage.Unlock') }}
        </button>
        <button @click="showResetModal = true" class="mt-4 text-ss text-gray-primary">
          {{ $t('Common.ForgetPassword') }}?
        </button>
      </div>
    </form>

    <ResetModal v-model:show="showResetModal" />
  </div>
</template>
