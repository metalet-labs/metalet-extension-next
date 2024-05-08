<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectItem, SelectItemIndicator, type SelectItemProps, SelectItemText, useForwardProps } from 'radix-vue'
import { cn } from '@/lib/utils'
import CheckedSuccessIcon from '@/assets/icons-v3/success-checked.svg'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-4 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class
      )
    "
  >
    <SelectItemText>
      <slot />
    </SelectItemText>

    <span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <CheckedSuccessIcon class="h-4 w-4" />
      </SelectItemIndicator>
    </span>
  </SelectItem>
</template>
