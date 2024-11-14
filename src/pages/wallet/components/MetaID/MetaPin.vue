<script setup lang="ts">
import { PopCard } from '@/components'
import { network } from '@/lib/network'
import { computed } from 'vue'

const props = defineProps<{
  pop: string
  path?: string
  value: number
  popLv: number
  content?: string
  contentSummary: string
  contentTypeDetect: string
  contentType: 'utf-8' | 'image/jpeg' | string
}>()

const imageSrc = computed(() => {
  if (props.path?.startsWith('/nft/mrc721')) {
    try {
      const contentSummary = JSON.parse(props.contentSummary)
      return contentSummary.attachment[0].content.replace(
        'metafile://',
        `https://man${network.value === 'testnet' ? '-test' : ''}.metaid.io/content/`
      )
    } catch (error) {
      return ''
    }
  } else if (props?.contentTypeDetect.includes('image')) {
    return props?.content
  }
  return ''
})
</script>

<template>
  <div
    :class="[
      path?.startsWith('/nft/mrc721') ? 'border border-blue-primary' : '',
      !imageSrc ? 'bg-[#F5F7F9] xs:p-2' : 'border border-[#f5f5f5]',
      'flex items-center justify-center rounded-md relative aspect-square w-full overflow-hidden',
    ]"
  >
    <PopCard :level="popLv" class="absolute left-0 top-0 z-10" />
    <img :alt="contentSummary" class="w-full h-full object-contain" v-if="imageSrc" :src="imageSrc" />
    <div
      v-else
      :title="contentSummary"
      class="text-xs overflow-hidden line-clamp-4 scale-75 xs:scale-100 break-all text-black-primary"
    >
      {{ contentSummary }}
    </div>
    <span
      :title="`${value} sat`"
      class="absolute rounded right-0 bottom-1 py-3px px-1.5 bg-[#E2F4FF]/80 text-[#1472FF] text-xs scale-75"
    >
      {{ value }} sat
    </span>
  </div>
</template>

<style lang="css" scoped></style>
