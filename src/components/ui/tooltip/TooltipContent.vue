<script setup lang="ts">
import {
  TooltipContent,
  type TooltipContentEmits,
  type TooltipContentProps,
  TooltipPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<TooltipContentProps>(), {
  sideOffset: 4,
})
const emits = defineEmits<TooltipContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-950 shadow-md  duration-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300',
          $attrs.class ?? ''
        )
      "
    >
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
