<script lang="ts" setup>
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'

import actions from '@/data/authorize-actions'
const action = actions.AutoPayment

const accesses = ['Transactions for on-chain data with gas fees below 10,000 sats;', 'Only for MicrovisionChain']
</script>

<template>
  <h3 class="text-base">{{ action.title }}</h3>

  <ul class="mt-6 space-y-4">
    <li v-for="access in accesses" class="flex items-start gap-x-2">
      <CheckBadgeIcon class="h-6 w-6 text-blue-primary" />
      <div class="text-sm text-gray-700">{{ access }}</div>
    </li>
  </ul>
  <div class="text-sm text-gray-500">
    <span class="font-semibold">Note:</span> (You can disable this approval in the wallet's settings menu.)
  </div>
</template>
