<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useStorage from './lib/storage'
import { LANG_KEY } from './lib/storage/key'
import Toaster from '@/components/ui/toast/Toaster.vue'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

const storage = useStorage()
const { locale } = useI18n()
onMounted(async () => {
  locale.value = await storage.get(LANG_KEY, { defaultValue: 'en' })
})
</script>

<template>
  <div id="main" class="text-black-secondary">
    <Toaster />
    <VueQueryDevtools />
    <router-view></router-view>
  </div>
</template>

<style scoped lang="css"></style>
