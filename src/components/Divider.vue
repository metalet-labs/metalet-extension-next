<script setup lang="ts">
const { w, dashed } = defineProps<{
  w?: number
  dashed?: boolean
}>()
</script>

<template>
  <div
    :class="[w ? (w === 1 ? 'border-t' : `border-t-${w}`) : 'border-t', dashed ? 'border-dashed' : 'border-solid','bg-gray-secondary opacity-50']"
  ></div>
</template>

<style scoped lang="css"></style>
