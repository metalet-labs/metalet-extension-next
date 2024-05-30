<script setup>
import EmptyIcon from '@/assets/icons-v3/empty.svg'

defineProps({
  url: {
    type: String,
    required: false,
  },
})
</script>

<template>
  <div class="w-full py-12">
    <EmptyIcon class="mx-auto" />
  </div>
</template>

<style scoped lang="css"></style>
