<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import Toaster from '@/components/ui/toast/Toaster.vue'

</script>

<template>
  <div id="main" class="text-black-secondary">
    <Toaster />
    <VueQueryDevtools />
    <router-view></router-view>
  </div>
</template>

<style scoped lang="css"></style>
