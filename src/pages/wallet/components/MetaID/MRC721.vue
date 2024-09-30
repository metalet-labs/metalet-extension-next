<script setup lang="ts">
import { PopCard } from '@/components'
import { network } from '@/lib/network'

defineProps<{
  pop: string
  value: number
  popLv: number
  contentSummary: string
}>()
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center rounded-md relative aspect-square w-full overflow-hidden border border-[#f5f5f5]',
    ]"
  >
    <PopCard :level="popLv" class="absolute left-0 top-0 z-10" />
    <img
      :src="
        JSON.parse(contentSummary).attachment[0].content.replace(
          'metafile://',
          `https://man${network === 'testnet' ? '-test' : ''}.metaid.io/content/`
        )
      "
      :alt="contentSummary"
      class="w-full h-full object-contain"
    />
    <span
      :title="`${value} sat`"
      class="absolute rounded right-0 bottom-1 py-3px px-1.5 bg-[#EBECFF] text-[#787FFF] text-xs scale-75"
    >
      {{ value }} sat
    </span>
  </div>
</template>

<style lang="css" scoped></style>
