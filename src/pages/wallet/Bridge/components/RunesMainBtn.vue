<script setup lang="ts">
defineProps({
  dangerous: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <button class="group relative z-30 inline-flex w-full cursor-pointer overflow-hidden rounded-2xl">
    <span class="group-disabled:bg-zinc-800! group-enabled:gorgeous-btn-bg-for-runes absolute inset-[-1000%]"></span>
    <span
      class="m-0.5 inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl px-3 py-4 text-xl font-medium backdrop-blur-3xl transition-all duration-200 group-hover:bg-opacity-70 group-disabled:cursor-not-allowed group-disabled:bg-blue-primary/60 group-enabled:bg-blue-primary/80 group-disabled:text-zinc-300/50 lg:m-px lg:bg-opacity-90"
      :class="[dangerous ? 'text-red-primary bg-red-primary/20' : 'text-white group-hover:text-teal-100']"
    >
      <slot></slot>
    </span>
  </button>
</template>
