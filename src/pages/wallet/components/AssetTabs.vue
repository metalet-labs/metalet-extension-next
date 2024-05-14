<script setup>
import AssetList from './AssetList.vue'
import NFTList from './NFTs/NFTList.vue'
import RuneList from './Runes/RuneList.vue'
import { walletTabStore } from '@/stores/walletTabTypeStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
</script>

<template>
  <Tabs :default-value="walletTabStore.selectedTab.name" class="w-full">
    <TabsList class="p-0 gap-6">
      <TabsTrigger
        :key="tab.id"
        :value="tab.name"
        v-for="tab in walletTabStore.tabs"
        @click="walletTabStore.selectedTab = tab"
      >
        {{ tab.name }}
        <span
          v-if="tab.isNew"
          class="bg-[#FFEBE7] text-red-primary px-1 py-0.5 rounded-t rounded-e text-xs font-semibold scale-[0.7] ml-16 -mt-5 absolute"
        >
          NEW
        </span>
      </TabsTrigger>
    </TabsList>
    <TabsContent value="Cypto">
      <AssetList />
    </TabsContent>
    <TabsContent value="NFTs">
      <NFTList />
    </TabsContent>
    <TabsContent value="Runes">
      <RuneList />
    </TabsContent>
    <TabsContent value="Activity"></TabsContent>
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
