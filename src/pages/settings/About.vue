<script lang="ts" setup>
import { Divider } from '@/components'
import { VERSION } from '@/data/config'
import LinkIcon from '@/assets/icons-v3/link.svg'
import MetaletLogo from '@/assets/images/metalet-logo-v3.svg?url'
</script>

<template>
  <div class="pt-20 flex flex-col items-center h-full">
    <img class="mx-auto w-[130px]" :src="MetaletLogo" alt="metalet-logo" />

    <div class="mt-5 text-center">
      <h1 class="text-3xl font-extrabold">Metalet</h1>
      <p class="mt-2 text-sm text-gray-primary">v{{ VERSION }}</p>
    </div>

    <div class="w-64 mt-6 grow">
      <Divider />
      <a target="_blank" class="flex items-center justify-between py-4" href="https://metalet.space/terms-of-service">
        <span class="text-sm font-medium">{{ $t('Common.TermsOfService') }}</span>
        <LinkIcon class="w-4.5" />
      </a>
      <Divider />
      <a target="_blank" class="flex items-center justify-between py-4" href="https://metalet.space/privacy-policy">
        <span class="text-sm font-medium">{{ $t('Common.PrivacyPolicy') }}</span>
        <LinkIcon class="w-4.5" />
      </a>
      <Divider />
    </div>

    <a href="https://metalet.space" target="_blank" class="text-center text-xs text-blue-primary py-12 hover:underline hover:underline-offset-4">
      {{ $t('AboutPage.LinkTips') }}
    </a>
  </div>
</template>
