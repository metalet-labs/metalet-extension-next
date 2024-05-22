<script setup lang="ts">
const { value, content } = defineProps<{
  value: number
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
      { 'bg-[#F5F5F5] xs:p-2': !(contentType.includes('image') || contentTypeDetect.includes('image')) },
      { 'border border-[#f5f5f5]': contentType.includes('image') || contentTypeDetect.includes('image') },
    ]"
  >
    <img :src="content" :alt="contentSummary" v-if="contentTypeDetect.includes('image')" class="w-full h-full" />
    <div
      v-else
      :title="contentSummary"
      class="text-xs overflow-hidden line-clamp-4 scale-75 xs:scale-100 sm:line-clamp-5 md:line-clamp-6 break-all"
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
