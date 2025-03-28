<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import BgHueImg from './assets/images/bg-hue.png?url'
import TheFooter from './components/the-footer/Index.vue'
import TheHeader from './components/headers/TheHeader.vue'
import SecondaryHeader from './components/headers/SecondaryHeader.vue'

const { t } = useI18n()
const route = useRoute()

const noFooter = computed(() => {
  return route.meta.noFooter
})

const showSecondaryHeader = computed(() => route.meta?.secondaryHeader ?? false)

const secondaryHeaderTitle = computed(() => {
  const headerTitleKey = route.meta?.headerTitleKey as string | undefined
  return headerTitleKey ? t(headerTitleKey) : route.meta.headerTitle
})

const backRouter = computed(() => {
  return route.meta.backRouter as string | undefined
})
</script>

<template>
  <div
    class="ext-app relative flex h-150 w-90 items-center justify-center overflow-y-auto xs:h-screen xs:w-screen xs:bg-gray-200/10 text-black-secondary"
  >
    <!-- bg -->
    <div
      class="fixed left-0 top-0 isolate z-[-1] hidden h-1/2 w-full select-none bg-cover bg-center bg-no-repeat xs:block"
    >
      <img class="z-[-1] h-full w-full select-none opacity-100" :src="BgHueImg" alt="bg-hue" />
    </div>

    <main
      class="ext-app flex h-full w-full flex-col xs:relative xs:aspect-[1/2] xs:h-3/4 xs:w-auto xs:min-w-[25rem] xs:rounded-lg xs:border xs:border-gray-100 xs:bg-white xs:shadow-lg overflow-hidden"
    >
      <!-- Header -->
      <SecondaryHeader v-if="showSecondaryHeader || secondaryHeaderTitle" :backRouter="backRouter">
        <template #title>
          {{ secondaryHeaderTitle }}
        </template>
      </SecondaryHeader>

      <TheHeader v-if="false" />

      <!-- content -->
      <div class="isolate grow px-4 py-3 overflow-y-auto nicer-scrollbar">
        <router-view></router-view>
      </div>

      <!-- footer -->
      <TheFooter v-if="!noFooter" />
    </main>
  </div>
</template>

<style scoped lang="css">
.ext-app::-webkit-scrollbar {
  @apply h-1.5 w-1.5;
}

.ext-app::-webkit-scrollbar-track {
  @apply rounded-full bg-transparent;
}

.ext-app::-webkit-scrollbar-thumb {
  @apply rounded-full bg-gray-200;
}

.ext-app::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-300;
}
</style>
