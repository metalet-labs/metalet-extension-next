<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button
        variant="secondary"
        size="icon"
        class="group origin-bottom-right w-7 h-7 cursor-pointer rounded-md transition duration-200 hover:scale-110"
      >
        <FileClockIcon class="text-gray-primary cursor-pointer" />
      </Button>
    </DialogTrigger>

    <DialogContent class="p-1 xs:p-4 bg-white rounded-xl">
      <DialogHeader>
        <DialogTitle class="text-xl">History</DialogTitle>
        <DialogClose class="right-0 top-0" />
      </DialogHeader>

      <Tabs v-model:value="activeKey" :default-value="items[0].key">
        <TabsList class="gap-x-4">
          <TabsTrigger
            v-for="item in items"
            :key="item.key"
            :value="item.key"
            class="p-0 data-[state=active]:shadow-none data-[state=active]:text-blue-primary data-[state=active]:underline data-[state=active]:underline-offset-4"
          >
            {{ item.label }}
          </TabsTrigger>
        </TabsList>
        <TabsContent v-for="item in items" :key="item.key" :value="item.key" class="w-full">
          <component :is="item.component" :type="item.type" />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { FileClockIcon } from 'lucide-vue-next'
import BridgeHistoryPanel from './BridgeHistoryPanel.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from '@/components/ui/dialog'

const props = defineProps({
  protocolType: {
    type: String,
    required: true,
    validator: (value) => ['btc', 'brc20', 'arc20', 'runes', 'mrc20'].includes(value),
  },
  bridgeType: {
    type: String,
    required: true,
    validator: (value) => ['mint', 'redeem'].includes(value),
  },
})

const activeKey = ref('btcToMvc')

const items = computed(() => {
  if (props.protocolType === 'mrc20') {
    return [
      {
        key: 'mrc20ToMvc',
        label: 'BTC To MVC',
        component: BridgeHistoryPanel,
        type: 'mrc20ToMvc',
      },
      {
        key: 'mvcToMrc20',
        label: 'MVC To BTC',
        component: BridgeHistoryPanel,
        type: 'mvcToMrc20',
      },
    ]
  }
  if (props.protocolType === 'btc') {
    return [
      {
        key: 'btcToMvc',
        label: 'BTC To MVC',
        component: BridgeHistoryPanel,
        type: 'btcToMvc',
      },
      {
        key: 'mvcToBtc',
        label: 'MVC To BTC',
        component: BridgeHistoryPanel,
        type: 'mvcToBtc',
      },
    ]
  }
  return []
})

watch(
  [() => props.protocolType, () => props.bridgeType],
  () => {
    let key = ''
    if (props.bridgeType === 'redeem') {
      key += 'mvcTo'
      if (props.protocolType === 'btc') {
        key += 'Btc'
      }
      if (props.protocolType === 'brc20') {
        key += 'Brc20'
      }
      if (props.protocolType === 'runes') {
        key += 'Runes'
      }
      if (props.protocolType === 'mrc20') {
        key += 'Mrc20'
      }
    }

    if (props.bridgeType === 'mint') {
      key += props.protocolType
      key += 'ToMvc'
    }
    activeKey.value = key
  },
  { immediate: true }
)
</script>
