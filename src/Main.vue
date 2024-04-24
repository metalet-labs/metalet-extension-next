<script setup lang="ts">
import Toaster from '@/components/ui/toast/Toaster.vue'

</script>

<template>
  <div id="main" class="text-black-secondary">
    <Toaster />
    <router-view></router-view>
  </div>
</template>

<style scoped lang="css"></style>
