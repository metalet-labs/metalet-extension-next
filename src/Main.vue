<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { needMigrate } from '@/lib/migrate'
import { WalletsStore } from '@/stores/WalletStore'
import Toaster from '@/components/ui/toast/Toaster.vue'

const router = useRouter()

onMounted(async () => {
  if (await needMigrate()) {
    router.push('/migrateV2')
  } else {
    await WalletsStore.getWalletManager()
    WalletsStore.loadOtherAccounts()
  }
})
</script>

<template>
  <div id="main" class="text-black-secondary">
    <Toaster />
    <router-view></router-view>
  </div>
</template>

<style scoped lang="css"></style>
