<script lang="ts" setup>
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'

import actions from '@/data/authorize-actions'
const action = actions.UnlockP2PKHInput
</script>

<template>
  <h3 class="text-base">{{ action.title }}</h3>

  <ul class="mt-6 space-y-4">
    <li v-for="access in action.description" class="flex items-start gap-x-2">
      <CheckBadgeIcon class="h-6 w-6 text-blue-primary" />
      <div class="text-sm text-gray-700">{{ access }}</div>
    </li>
  </ul>
</template>