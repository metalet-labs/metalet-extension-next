<script lang="ts" setup>
import { ref } from 'vue'
import { hasWallets } from '@/lib/wallet'
import Balance from './components/Balance.vue'
import AccountHeader from './AccountHeader.vue'
import AssetTabs from './components/AssetTabs.vue'
import { WalletsStore } from '@/stores/WalletStore'
import BackupTips from './components/BackupTips.vue'
import { hasBackupCurrentWallet } from '@/lib/backup'

const noBackup = ref(true)
hasBackupCurrentWallet().then((_backup) => {
  noBackup.value = !_backup
})

hasWallets().then(async (_hasWallets) => {
  
  console.time();
  
  await WalletsStore.initWalletManager()

  console.timeEnd();
  
})
</script>

<template>
  <div class="nicer-scrollbar space-y-6 relative min-h-full">
    <AccountHeader />

    <Balance />

    <AssetTabs />

    <BackupTips v-model:open="noBackup" />
  </div>
</template>
