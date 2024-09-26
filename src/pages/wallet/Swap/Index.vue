<script lang="ts" setup>
import { computed } from 'vue'
import RunesSwap from './Runes/RuneSwap.vue'
import BRC20Swap from './BRC20/BRC20Swap.vue'
import { Protocol } from '@/lib/types/protocol'
import SwapIcon from '@/assets/icons-v3/swap.svg'
import { Chain } from '@metalet/utxo-wallet-service'
import { useSwapPool } from '@/hooks/swap/useSwapPool'
import { swapTabStore } from '@/stores/SwapTabTypeStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { network } from '@/lib/network'

const { chain, protocol, pairStr } = useSwapPool()

const tabs = computed(() => swapTabStore.tabs.filter((tab) => tab.chain === chain.value))
</script>

<template>
  <div class="-mx-4 h-full overflow-y-auto nicer-scrollbar px-4">
    <div class="mt-2 flex items-center justify-between text-blue-primary">
      <a
        target="_blank"
        :href="
          network === 'testnet'
            ? 'https://testnet.orders.exchange/swap/ticket'
            : 'https://app.orders.exchange/swap/ticket'
        "
        class="py-2 px-4 bg-[#F5F6FF] rounded-2xl text-xs font-medium flex items-center gap-1 cursor-pointer"
      >
        {{ $t('SwapPage.SwappingOnMvc') }}
        <!-- {{ chain === Chain.MVC ? $t('SwapPage.SwappingOnBtc') : $t('SwapPage.SwappingOnMvc') }} -->
        <SwapIcon class="w-3 h-3" />
      </a>
      <RouterLink to="/" class="underline hidden">Pools</RouterLink>
    </div>
    <Tabs :modelValue="protocol" class="flex flex-col items-start mt-3 rounded-lg">
      <TabsList class="p-1 shrink-0 h-12 w-full bg-[#F5F7F9]" v-if="tabs.length > 1">
        <TabsTrigger
          :key="tab.id"
          :value="tab.name"
          v-for="tab in tabs"
          @click="
            () => {
              pairStr = ''
              swapTabStore.selectedTab = tab
              protocol = tab.name.toLocaleLowerCase()
            }
          "
          :class="[
            'grow rounded-md h-full font-medium text-sm text-gray-primary',
            { 'bg-white text-blue-primary': protocol === tab.name.toLocaleLowerCase() },
          ]"
        >
          <span :class="[tab.textColor]">{{ tab.name }}</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent :key="Protocol.Runes" :value="Protocol.Runes.toLocaleLowerCase()" class="pt-4 w-full">
        <RunesSwap />
      </TabsContent>
      <TabsContent :key="Protocol.BRC20" :value="Protocol.BRC20.toLocaleLowerCase()" class="pt-4 w-full">
        <BRC20Swap />
      </TabsContent>
    </Tabs>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
