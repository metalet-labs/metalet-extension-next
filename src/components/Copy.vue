<script lang="ts" setup>
import { twMerge } from 'tailwind-merge'
import CopyIcon from '@/assets/icons-v3/copy.svg'
import { ClipboardStore } from '@/stores/ClipboardStore'

withDefaults(
  defineProps<{
    text: string
    title?: string
    showContent?: boolean
  }>(),
  {
    showContent: true,
  }
)
</script>

<template>
  <CopyIcon
    @click="ClipboardStore.copy(text, title, showContent)"
    :class="
      twMerge(
        'hover:text-blue-primary cursor-pointer w-[22px]',
        $attrs.class as string,
        ClipboardStore.copiedText === text ? 'text-blue-primary' : 'text-gray-primary'
      )
    "
  />
</template>
