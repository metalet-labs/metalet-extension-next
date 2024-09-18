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
      class="text-white m-0.5 inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-blue-primary bg-opacity-80 px-3 py-4 text-xl font-medium backdrop-blur-3xl transition-all duration-200 group-hover:bg-opacity-70 group-disabled:cursor-not-allowed group-disabled:bg-blue-primary/60 group-disabled:text-zinc-300/50 lg:m-px lg:bg-opacity-90"
      :class="[dangerous ? 'text-red-primary bg-gray-soft' : 'text-runes group-hover:text-teal-100']"
    >
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.gorgeous-btn-bg-for-runes {
  background: conic-gradient(
    from 90deg at 50% 50%,
    #14b8a6 0%,
    #075985 30%,
    #14b8a6 100%
  );
  animation: spin 2s linear infinite;
}
</style>
