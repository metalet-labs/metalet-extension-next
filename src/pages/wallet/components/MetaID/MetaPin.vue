<script setup lang="ts">
import { PopCard } from '@/components'

const props = defineProps<{
  pop: string
  value: number
  popLv: number
  content: string
  contentSummary: string
  contentTypeDetect: string
  contentType: 'utf-8' | 'image/jpeg' | string
}>()
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center rounded-md relative aspect-square w-full overflow-hidden',
      { 'bg-blue-primary xs:p-2': !(contentType.includes('image') || contentTypeDetect.includes('image')) },
      { 'border border-[#f5f5f5]': contentType.includes('image') || contentTypeDetect.includes('image') },
    ]"
  >
    <PopCard :level="popLv" class="absolute left-0 top-0" />
    <img
      :src="content"
      :alt="contentSummary"
      v-if="contentTypeDetect.includes('image')"
      class="w-full h-full object-contain"
    />
    <div
      v-else
      :title="contentSummary"
      class="text-xs overflow-hidden line-clamp-4 scale-75 xs:scale-100 sm:line-clamp-5 md:line-clamp-6 break-all text-white"
    >
      {{ contentSummary }}
    </div>
    <span
      :title="`${value} sat`"
      class="absolute rounded right-0 bottom-1 py-3px px-1.5 bg-[#EBECFF] text-[#787FFF] text-xs scale-75"
    >
      {{ value }} sat
    </span>
  </div>
</template>

<style lang="css" scoped></style>
