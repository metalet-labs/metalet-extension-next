<template>
  <div :class="cn('flex h-full flex-col items-center justify-center', className)">
    <EmptyIcon />
    <div>
      <span v-if="description" class="font-sm mt-2 text-[#37463A]">{{ description }}</span>
    </div>
  </div>
</template>

<script setup>
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import { cn } from '@/lib/utils'

const props = defineProps({
  description: {
    type: String,
    default: '',
  },
  className: {
    type: String,
    default: '',
  },
})
</script>
