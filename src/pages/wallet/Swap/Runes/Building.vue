<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2Icon } from 'lucide-vue-next'
import { useBuildingOverlay } from '@/hooks/swap/use-building-overlay'

const { isBuilding } = useBuildingOverlay()
const route = useRoute()
const accentColor = computed(() => {
  const fullPath = route.fullPath

  if (fullPath.includes('runes')) return 'text-runes'
  if (fullPath.includes('idcoin')) return 'text-idcoin'

  return 'text-primary'
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/40 px-8 backdrop-blur"
    v-show="isBuilding"
  >
    <div
      class="flex h-48 w-80 xs:w-96 max-w-lg items-center justify-center gap-4 rounded-xl bg-zinc-800 text-center text-zinc-300"
    >
      <Loader2Icon class="h-8 w-8 animate-spin" :class="accentColor" />
      <p>Building Transaction...</p>
    </div>
  </div>
</template>
