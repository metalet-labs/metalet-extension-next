<script lang="ts" setup>
import type { TransferTask, Receiver } from '@/lib/actions/transfer'
import { shortestAddress } from '@/lib/formatters'
import Decimal from 'decimal.js'

defineProps<{
  task: TransferTask
  receiver: Receiver
}>()

function prettyAmount(receiver: Receiver) {
  return new Decimal(receiver.amount).div(10 ** Number(receiver?.decimal || 8)).toFixed(Number(receiver?.decimal || 8))
}
</script>

<template>
  <tr>
    <td class="td-cell">{{ task.genesis ? 'Token' : 'SPACE' }}</td>
    <td class="td-cell">{{ prettyAmount(receiver) }}</td>
    <td class="td-cell" :title="receiver.address">{{ shortestAddress(receiver.address) }}</td>
  </tr>
</template>

<style scoped>
.td-cell {
  @apply border border-gray-200 px-4 py-2 text-xs text-gray-700;
}
</style>
