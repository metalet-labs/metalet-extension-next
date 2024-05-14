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
        v-for="tab in walletTabStore.tabs"
        :key="tab.id"
        :value="tab.name"
        @click="walletTabStore.selectedTab = tab"
      >
        {{ tab.name }}
        <span
          v-if="tab.isNew"
          class="bg-red-primary text-white px-2 py-1 rounded-full text-xs font-semibold scale-50 ml-14 -mt-5 absolute"
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
