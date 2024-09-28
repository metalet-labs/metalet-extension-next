<script lang="ts" setup>
import { ref, computed } from 'vue'
import { unlock } from '@/lib/lock'
import passwordManager from '@/lib/password'
import { Checkbox } from '@/components/ui/checkbox'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
import { FlexBox, Button, PasswordInput } from '@/components'

const { callback } = defineProps<{ callback?: Function }>()

const error = ref()
const password = ref()
const checked = ref(false)
const confirmPassword = ref()
const btnDisabled = computed(
  () => !checked.value || !password.value || password.value.length < 6 || !confirmPassword.value
)

const submit = async () => {
  error.value = undefined
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
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
      <div class="text-2xl font-medium">Set Password</div>
    </FlexBox>
    <p class="mt-2 font-medium">Set a password to manage your wallet</p>
    <p class="mt-2 text-sm text-gray-primary">
      It's important to note that we do not retain your password, thus if it is forgotten, you will need to reset your
      wallet and re-import it to establish a new one.
    </p>
    <FlexBox d="col" class="mt-9 gap-y-10">
      <PasswordInput v-model:password="password" title="New Password (at least 6 characters)" :validate="true" />
      <PasswordInput v-model:password="confirmPassword" title="Confirm" v-model:error="error" />
    </FlexBox>
    <FlexBox d="col" ai="center" jc="center" class="mt-16" :gap="4">
      <FlexBox ai="center" :gap="1.5">
        <Checkbox id="terms" v-model:checked="checked" />
        <span class="text-slate-light">
          {{ $t('WelcomePage.AgreePrefixTips') }}
          <a target="_blank" class="text-blue-primary" href="https://metalet.space/terms-of-service">
            Terms of Service
          </a>
        </span>
      </FlexBox>
      <Button type="primary" @click="submit" :disabled="btnDisabled" :class="['w-61.5', btnDisabled && 'opacity-50']">
        {{ $t('Common.Confirm') }}
      </Button>
    </FlexBox>
  </FlexBox>
</template>
