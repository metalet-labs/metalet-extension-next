<script lang="ts" setup>
import { computed } from 'vue'
import BTCBridge from './components/BTCBridge.vue'
import MRC20Bridge from './components/MRC20Bridge.vue'
import { bridgeTabStore } from '@/stores/BridgeTabStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = computed(() => bridgeTabStore.tabs)
</script>

<template>
  <div class="-mx-4 h-full overflow-y-auto nicer-scrollbar px-4">
    <Tabs :modelValue="bridgeTabStore.selectedTab.name" class="flex flex-col items-start mt-3 rounded-lg">
      <TabsList class="p-1 shrink-0 h-12 w-full bg-[#F5F7F9]" v-if="tabs.length > 1">
        <TabsTrigger
          :key="tab.id"
          :value="tab.name"
          v-for="tab in tabs"
          @click="bridgeTabStore.selectedTab = tab"
          :class="[
            'grow rounded-md h-full font-medium text-sm text-gray-primary',
            { 'bg-white text-blue-primary': bridgeTabStore.selectedTab.name === tab.name },
          ]"
        >
          <span>{{ tab.name.toLocaleUpperCase() }}</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent :value="'BTC'" :key="'BTC'" class="pt-4 w-full">
        <BTCBridge />
      </TabsContent>
      <TabsContent :value="'MRC20'" :key="'MRC20'" class="pt-4 w-full">
        <MRC20Bridge />
      </TabsContent>
    </Tabs>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
