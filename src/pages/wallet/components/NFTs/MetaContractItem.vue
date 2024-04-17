<script setup lang="ts">
const { metaContractItem } = defineProps<{
  metaContractItem: {
    id: string
    name: string
    imgUrl: string
    seriesName: string
  }
}>()
</script>

<template>
  <div class="cursor-pointer">
    <img :src="metaContractItem.imgUrl" class="w-full aspect-square rounded-md" />
    <div class="text-sm mt-1.5 truncate text-center">{{ metaContractItem.name }}</div>
    <div class="text-xs truncate text-gray-primary text-center">{{ metaContractItem.seriesName }}</div>
  </div>
</template>

<style scoped lang="css"></style>
