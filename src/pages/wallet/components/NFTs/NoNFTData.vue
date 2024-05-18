<script setup>
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import NO_NFT_DATA_PNG from '@/assets/icons-v3/nft_no_data.png'

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
