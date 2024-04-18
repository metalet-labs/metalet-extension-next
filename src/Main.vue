<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { hasWallets } from './lib/wallet'
import { WalletsStore } from '@/stores/WalletStore'
import Toaster from '@/components/ui/toast/Toaster.vue'

const router = useRouter()

onMounted(async () => {
  if (await hasWallets()) {
    await WalletsStore.initWalletManager()
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
