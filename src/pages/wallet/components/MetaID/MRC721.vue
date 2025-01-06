<script setup lang="ts">
import { computed } from 'vue'
import { PopCard } from '@/components'
import { getMetaFileUrl } from '@/lib/mrc721'

const props = defineProps<{
  pop: string
  value: number
  popLv: number
  cover?: string
  content?: string
  contentSummary: string
}>()

const imageSrc = computed(() => {
  try {
    if (props.cover) {
      return getMetaFileUrl(props.cover)
    }
    if (props.content) {
      const metafile = props.content.startsWith('metafile://')
        ? props.content
        : JSON.parse(props.content).attachment[0].content
      return getMetaFileUrl(metafile)
    }
  } catch (error) {
    console.error('Error getting image URL:', error)
    return ''
  }
})
</script>

<template>
  <div
    class="relative w-full aspect-square bg-white rounded-lg overflow-hidden"
    :class="{ 'border border-[#f5f5f5]': imageSrc }"
  >
    <PopCard :level="popLv" class="absolute left-0 top-0 z-10" />
    <div class="w-full h-full flex items-center justify-center">
      <img :src="imageSrc" :alt="contentSummary" class="max-w-full max-h-full object-contain" v-if="imageSrc" />
      <div class="line-clamp-6 text-xs break-all px-1.5" v-else>{{ contentSummary }}</div>
    </div>
    <span
      :title="`${value} sat`"
      class="absolute rounded right-0 bottom-1 py-3px px-1.5 bg-[#E2F4FF]/80 text-[#1472FF] text-xs scale-75"
    >
      {{ value }} sat
    </span>
  </div>
</template>
