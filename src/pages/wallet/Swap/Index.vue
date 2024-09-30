<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { network } from '@/lib/network'
import RunesSwap from './Runes/RuneSwap.vue'
import BRC20Swap from './BRC20/BRC20Swap.vue'
import { Protocol } from '@/lib/types/protocol'
import { useRouteParams } from '@vueuse/router'
import SwapIcon from '@/assets/icons-v3/swap.svg'
import useRunesPool from '@/hooks/swap/useRunesPool'
import useBRC20Pool from '@/hooks/swap/useBRC20Pool'
import { swapTabStore } from '@/stores/SwapTabTypeStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const chain = useRouteParams<string>('chain')
const pairStr = useRouteParams<string>('pair')
const { pairStr: runesPairStr } = useRunesPool()
const { pairStr: brc20PairStr } = useBRC20Pool()
const protocol = useRouteParams<string>('protocol')

const tabs = computed(() => swapTabStore.tabs.filter((tab) => tab.chain === chain.value))

onMounted(() => {
  if (!chain.value) {
    chain.value = 'btc'
  }
  if (!protocol.value) {
    protocol.value = swapTabStore.selectedTab.name.toLocaleLowerCase()
    pairStr.value = swapTabStore.selectedTab.name === Protocol.Runes ? runesPairStr.value : brc20PairStr.value
  }
})
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
    <Tabs
      :modelValue="swapTabStore.selectedTab.name.toLocaleLowerCase()"
      class="flex flex-col items-start mt-3 rounded-lg"
    >
      <TabsList class="p-1 shrink-0 h-12 w-full bg-[#F5F7F9]" v-if="tabs.length > 1">
        <TabsTrigger
          :key="tab.id"
          :value="tab.name"
          v-for="tab in tabs"
          @click="
            () => {
              swapTabStore.selectedTab = tab
              protocol = tab.name.toLocaleLowerCase()
              pairStr = tab.name === Protocol.Runes ? runesPairStr : brc20PairStr
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
