<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentAccount } from '@/lib/account'
import { WalletsStore } from '@/stores/WalletStore'
import MetaletLogoImg from '@/assets/images/metalet-logo-v3.svg?url'
import { migrateToV2, migrateToV3, migrateToV3Encrypted } from '@/lib/migrate'

const router = useRouter()

onMounted(async () => {
  await migrateToV2()
  await migrateToV3()
  await migrateToV3Encrypted()
  await WalletsStore.initWalletManager()
  if (await getCurrentAccount()) {
    router.push('/wallet')
  } else {
    router.push('/manage/wallets')
  }
})

</script>

<template>
  <div class="fixed inset-0 w-full h-full bg-white">
    <div class="flex flex-col items-center justify-center h-full">
      <div class="mt-12">
        <img class="mx-auto h-20 w-20" :src="MetaletLogoImg" alt="metalet-logo" />
      </div>
      <div class="text-2xl font-bold mt-16">Migrating to new version...</div>
      <div class="text-lg text-gray-500">Please wait a moment.</div>
    </div>
  </div>
</template>
