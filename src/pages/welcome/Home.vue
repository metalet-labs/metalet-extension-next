<script lang="ts" setup>
import { ref } from 'vue'
import { getAccounts } from '@/lib/account'
import { FlexBox, Button } from '@/components'
import { Checkbox } from '@/components/ui/checkbox'
import WelcomeLogo from '@/assets/icons-v3/welcome-logo.svg'

const checked = ref(false)

const accountsCount = ref(0)
getAccounts().then((accounts) => {
  accountsCount.value = accounts.size
})
</script>

<template>
  <FlexBox ai="center" jc="center" :gap="12" class="w-full h-full">
    <FlexBox d="col" class="gap-y-15">
      <FlexBox d="col" :gap="3">
        <h3 class="text-2xl font-semibold w-80">
          {{ $t('WelcomePage.Title') }}
        </h3>
        <p class="text-gray-primary w-96">{{ $t('WelcomePage.Tips') }}</p>
      </FlexBox>
      <FlexBox d="col" :gap="4">
        <div class="flex gap-2">
          <Button
            type="light"
            :disabled="!checked"
            @click="$router.push('/welcome/import')"
            :class="['w-32.5', !checked ? 'opacity-50' : undefined]"
          >
            {{ $t('WelcomePage.ImportWallet') }}
          </Button>
          <Button
            type="primary"
            :disabled="!checked"
            @click="$router.push('/welcome/create')"
            :class="['w-32.5', !checked ? 'opacity-50' : undefined]"
          >
            {{ $t('WelcomePage.CreateWallet') }}
          </Button>
        </div>
        <FlexBox :gap="1.5" ai="center">
          <Checkbox id="terms" v-model:checked="checked" />
          <span class="text-slate-light">
            {{ $t('WelcomePage.AgreePrefixTips') }}
            <a target="_blank" class="text-blue-primary" href="https://metalet.space/terms-of-service">
              {{ $t('Common.TermsOfService') }}
            </a>
          </span>
        </FlexBox>
      </FlexBox>
    </FlexBox>
    <WelcomeLogo />
  </FlexBox>
</template>
