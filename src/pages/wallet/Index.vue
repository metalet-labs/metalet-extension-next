<script lang="ts" setup>
import { ref } from 'vue'
import { hasWallets } from '@/lib/wallet'
import { hasPassword } from '@/lib/password'
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

hasPassword().then((_hasPassword) => {
  if (!_hasPassword) {
    hasWallets().then(async (_hasWallets) => {
      await WalletsStore.initWalletManager()
    })
  }
})
</script>

<template>
  <div class="relative flex flex-col gap-y-4 w-full h-full">
    <AccountHeader />

    <Balance />

    <AssetTabs class="grow overflow-y-hidden -mx-4" />

    <BackupTips v-model:open="noBackup" />
  </div>
</template>
