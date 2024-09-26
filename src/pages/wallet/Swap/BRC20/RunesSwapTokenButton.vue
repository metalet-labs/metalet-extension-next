<script setup lang="ts">
import RunesTokenIcon from './RunesTokenIcon.vue'
defineProps<{
  token: string
  symbol: string
}>()
</script>

<template>
  <button
    class="flex items-center gap-1 rounded-full border-2 border-zinc-700 bg-zinc-800 p-1.5 pr-3 text-zinc-300 hover:border-runes hover:bg-zinc-900 hover:text-runes"
  >
    <RunesTokenIcon :symbol="symbol" class="size-6 rounded-full" />
    <span>{{ token }}</span>
  </button>
</template>
