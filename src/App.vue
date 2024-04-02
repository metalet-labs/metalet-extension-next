<script setup lang="ts">
import { FEEB } from './data/config'
import { useRoute } from 'vue-router'
import { getNetwork } from './lib/network'
import { useQueryClient } from '@tanstack/vue-query'
import BgHueImg from './assets/images/bg-hue.png?url'
import { computed, Ref, inject, onMounted } from 'vue'
import TheFooter from './components/the-footer/Index.vue'
import TheHeader from './components/headers/TheHeader.vue'
import { API_NET, API_TARGET, Wallet } from 'meta-contract'
import { getCurrentAccount, getPrivateKey } from './lib/account'
import SecondaryHeader from './components/headers/SecondaryHeader.vue'

const route = useRoute()

const queryClient = useQueryClient()
queryClient.setDefaultOptions({
  queries: {
    staleTime: 1000 * 30, // 30 seconds
  },
})

const noFooter = computed(() => {
  return route.meta.noFooter
})

const secondaryHeaderTitle = computed(() => {
  return route.meta.headerTitle
})

const wallet: Ref<any> = inject('wallet')!

getCurrentAccount().then(async (account) => {
  if (account) {
    const network = await getNetwork()
    const wif = await getPrivateKey()

    wallet.value = new Wallet(wif, network as API_NET, FEEB, API_TARGET.MVC)
  }
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

    <div
      class="ext-app flex h-full w-full flex-col xs:relative xs:aspect-[1/2] xs:h-3/4 xs:w-auto xs:min-w-[25rem] xs:rounded-lg xs:border xs:border-gray-100 xs:bg-white xs:shadow-lg"
    >
      <!-- Header -->
      <SecondaryHeader v-if="route.meta.secondaryHeader">
        <template #title>
          {{ secondaryHeaderTitle }}
        </template>
      </SecondaryHeader>

      <TheHeader v-if="false" />

      <div class="isolate grow px-4 py-3 overflow-y-auto nicer-scrollbar">
        <router-view></router-view>
      </div>

      <!-- footer -->
      <TheFooter v-if="!noFooter" />
    </div>
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
