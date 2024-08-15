<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    symbol: string
    class?: string
  }>(),
  { class: '', symbol: 'R' },
)
</script>

<template>
  <div
    :class="[
      'flex shrink-0 items-center justify-center rounded-full border-2 border-teal-500 bg-teal-900 p-px text-base font-bold text-teal-100',
      props.class,
    ]"
  >
    <div class="">
      {{ symbol }}
    </div>
  </div>
</template>
