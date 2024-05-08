<script lang="ts" setup>
import { ref, computed } from 'vue'
import { unlock } from '@/lib/lock'
import passwordManager from '@/lib/password'
import { Checkbox } from '@/components/ui/checkbox'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
import { FlexBox, Button, PasswordInput } from '@/components'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid'

const { callback } = defineProps<{ callback?: Function }>()

const error = ref()
const password = ref()
const checked = ref(false)
const isCovered = ref(true)
const confirmPassword = ref()
const isConfirmCovered = ref(true)
const passwordInputType = computed(() => (isCovered.value ? 'password' : 'text'))
const passwordConfirmInputType = computed(() => (isConfirmCovered.value ? 'password' : 'text'))
const btnDisabled = computed(
  () => !checked.value || !password.value || password.value.length < 8 || !confirmPassword.value
)

const submit = async () => {
  error.value = undefined
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'The passwords entered twice do not match.'
    return
  }

  await passwordManager.set(password.value)
  await unlock(password.value)
  callback && callback()
}
</script>

<template>
  <FlexBox d="col" class="w-82">
    <FlexBox ai="center" :gap="3">
      <ArrowLeftIcon @click="$router.go(-1)" class="cursor-pointer w-3.5" />
      <div class="text-2xl font-medium">Create Password</div>
    </FlexBox>
    <p class="mt-2 text-sm text-gray-primary">
      This password is only used to unlock your Metalet wallet on this device. Metalet cannot recover this password for you.
    </p>
    <FlexBox d="col" class="mt-9 gap-y-10">
      <PasswordInput v-model:password="password" title="New Password (at least 8 characters)" :validate="true" />
      <PasswordInput v-model:password="confirmPassword" title="Confirm Password" v-model:error="error" />
    </FlexBox>
    <FlexBox d="col" ai="center" jc="center" class="mt-16" :gap="4">
      <FlexBox ai="center" :gap="1.5">
        <Checkbox id="terms" v-model:checked="checked" />
        <span class="text-slate-light">
          I agree to Metalet's
          <a
            target="_blank"
            class="text-blue-primary"
            href="https://docs.google.com/document/d/1JFUS6f3Vs3Jh2CA4xpTixOUaMto4pANxmM_7b3suut8/edit"
          >
            Terms of Service
          </a>
        </span>
      </FlexBox>
      <Button type="primary" @click="submit" :disabled="btnDisabled" :class="['w-61.5', btnDisabled && 'opacity-50']">
        Confirm
      </Button>
    </FlexBox>
  </FlexBox>
</template>
