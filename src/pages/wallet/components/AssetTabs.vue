<script setup>
import { ref } from 'vue'
import AssetList from './AssetList.vue'
import NFTList from './NFTs/NFTList.vue'
import MRC20List from './MRC20/MRC20List.vue'
import MetaIDList from './MetaID/MetaIDList.vue'
import { getServiceNetwork } from '@/lib/network'
import { Chain } from '@metalet/utxo-wallet-service'
import { walletTabStore } from '@/stores/walletTabTypeStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const service = ref(Object.values(Chain))

getServiceNetwork().then((_service) => {
  service.value = _service
  if (walletTabStore.selectedTab.chain === Chain.BTC && !service.value.includes(Chain.BTC)) {
    walletTabStore.selectedTab = walletTabStore.tabs.find((tab) => tab.chain !== Chain.BTC)
  }
})
</script>

<template>
  <Tabs :modelValue="walletTabStore.selectedTab.name" class="h-full flex flex-col items-start">
    <TabsList class="p-0 gap-6 px-4 shrink-0">
      <TabsTrigger
        :key="tab.id"
        :value="tab.name"
        v-for="tab in walletTabStore.tabs"
        @click="walletTabStore.selectedTab = tab"
      >
        <template v-if="!tab.chain || service.includes(tab.chain)">
          <span>{{ tab.name }}</span>
          <span
            v-if="tab.isNew"
            class="bg-[#FFEBE7] text-red-primary px-1 py-0.5 rounded-t rounded-e text-xs font-semibold scale-[0.7] ml-[70px] -mt-5 absolute"
          >
            {{ $t('HomePage.NEW') }}
          </span>
        </template>
      </TabsTrigger>
    </TabsList>
    <TabsContent value="Crypto" key="Crypto" class="overflow-y-auto w-full nicer-scrollbar px-4">
      <AssetList />
    </TabsContent>
    <TabsContent value="NFTs" key="NFTs" class="overflow-y-auto w-full nicer-scrollbar px-4">
      <NFTList />
    </TabsContent>
    <TabsContent value="MRC20" key="MRC20" class="overflow-y-auto w-full nicer-scrollbar px-4">
      <MRC20List />
    </TabsContent>
    <TabsContent value="MetaID PIN" key="MetaID PIN" class="overflow-y-auto w-full nicer-scrollbar px-4">
      <MetaIDList />
    </TabsContent>
    <TabsContent value="Activity" class="overflow-y-auto w-full nicer-scrollbar px-4"></TabsContent>
  </Tabs>
</template>

<style scoped lang="css">
:deep(button[role='tab']) {
  @apply p-0;
}

:deep(button[role='tab'][aria-selected='true']) {
  @apply text-blue-primary shadow-none;
}
</style>
