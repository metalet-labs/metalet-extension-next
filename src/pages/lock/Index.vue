<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { setLastLockTime } from '@/lib/lock'
import ResetModal from '@/components/ResetModal.vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid'
import MetaletLogo from '@/assets/images/metalet-logo-v3.svg?url'

const password = ref('')
const router = useRouter()
const isCovered = ref(true)
const showResetModal = ref(false)
const passwordInputType = computed(() => (isCovered.value ? 'password' : 'text'))

const failed = ref(false)
const tryUnlock = async () => {
  const isCorrect = await passwordManager.check(password.value)
  if (isCorrect) {
    await passwordManager.unlock(password.value)
    await setLastLockTime()
    router.push('/wallet')
  } else {
    failed.value = true
  }
}
</script>

<template>
  <div class="pt-20">
    <img class="mx-auto w-[130px]" :src="MetaletLogo" alt="metalet-logo" />

    <div class="mt-5 text-center">
      <h1 class="text-3xl font-extrabold">Metalet</h1>
      <p class="mt-2 text-sm text-gray-primary">Welcome Back</p>
    </div>

    <div class="mt-12">
      <h4 class="mb-2 text-sm">Password</h4>
      <div class="relative">
        <input
          v-model="password"
          :type="passwordInputType"
          :class="[
            'block w-full rounded-md border border-gray-soft outline-blue-primary p-4 pr-12',
            { 'border-red-500': failed },
          ]"
        />
        <div class="absolute right-0 top-0 flex h-full items-center pr-4">
          <button @click="isCovered = !isCovered">
            <EyeIcon v-if="isCovered" class="h-5 w-5 text-gray-400 transition hover:text-blue-500" />
            <EyeSlashIcon v-else class="h-5 w-5 text-gray-400 transition hover:text-blue-500" />
          </button>
        </div>
        <p v-if="failed" class="absolute -bottom-8 left-0 text-sm text-red-500">Incorrect password. Try again.</p>
      </div>
    </div>

    <div class="mt-14 flex flex-col items-center justify-center">
      <button
        @click="tryUnlock"
        :class="[
          'bg-blue-primary w-61.5 rounded-3xl py-4 text-ss text-white',
          { 'opacity-50 cursor-not-allowed': !password },
        ]"
      >
        Unlock
      </button>
      <button @click="showResetModal = true" class="mt-4 text-ss text-gray-primary">Forget password?</button>
    </div>
    <ResetModal v-model:show="showResetModal" />
  </div>
</template>
