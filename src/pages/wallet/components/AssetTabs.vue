<script setup>
import AssetList from './AssetList.vue'
import NFTList from './NFTs/NFTList.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
</script>

<template>
  <div class="border-t border-primary-teal border-opacity-10 pt-4">
    <Tabs default-value="Cypto" class="w-full">
      <TabsList class="p-0 gap-6">
        <TabsTrigger value="Cypto">Cypto</TabsTrigger>
        <TabsTrigger value="NFTs">NFTs</TabsTrigger>
        <!-- <TabsTrigger value="Activity">Activity</TabsTrigger> -->
      </TabsList>
      <TabsContent value="Cypto">
        <AssetList />
      </TabsContent>
      <TabsContent value="NFTs">
        <NFTList />
      </TabsContent>
      <TabsContent value="Activity"></TabsContent>
    </Tabs>
  </div>
</template>

<style scoped lang="css">
:deep(button[role='tab']) {
  @apply p-0;
}

:deep(button[role='tab'][aria-selected='true']) {
  @apply text-blue-primary shadow-none;
}
</style>
