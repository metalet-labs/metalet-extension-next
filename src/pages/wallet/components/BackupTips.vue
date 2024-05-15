<script lang="ts" setup>
import DangerWarningIcon from '@/assets/icons-v3/danger-warning.svg'
defineProps<{
  open: boolean
}>()
</script>

<template>
  <div
    v-if="open"
    class="w-[calc(100% - 32px)] p-4 sticky bottom-0 rounded-lg bg-white shadow-[0px_4px_8px_0px_rgba(48,49,51,0.1)] flex gap-3 z-10"
  >
    <div class="w-6">
      <DangerWarningIcon />
    </div>
    <div class="space-y-3">
      <div class="font-medium">Please backup your wallet.</div>
      <div class="text-xs text-gray-primary">
        In the event of device loss, app reinstallation, or data deletion, this wallet, along with its assets, could be
        permanently lost and they cannot be recovered.
      </div>
      <button
        @click="$router.push('/wallet/backup')"
        class="round-md bg-blue-primary text-white text-ss font-medium px-6 py-2 rounded-3xl"
      >
        Backup now
      </button>
    </div>
  </div>
</template>
