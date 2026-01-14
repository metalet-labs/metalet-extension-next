<script lang="ts" setup>
import { computed } from 'vue'
import { MRC20Asset } from '@/data/assets'
import { getChainDisplayName, getChainColor, type SupportedChain } from '@/lib/actions/teleport'
import { prettifyBalanceFixed, calcBalance } from '@/lib/formatters'
import { AssetLogo, Divider, FlexBox, Button } from '@/components'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { ArrowRightIcon } from '@heroicons/vue/24/solid'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'

const props = defineProps<{
  open: boolean
  asset: MRC20Asset
  amount: string
  fromChain: SupportedChain
  toChain: SupportedChain
  fromFeeRate?: number
  toFeeRate?: number
  estimatedFee: {
    fromChainFee: number
    toChainFee: number
    totalFee: number
  } | null
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const handleConfirm = () => {
  emit('confirm')
}

// 格式化费率显示
const formatFeeRate = (chain: SupportedChain, rate?: number) => {
  if (!rate) return '--'
  if (chain === 'doge') {
    // DOGE 费率是 sat/KB
    const dogePerKb = rate / 100000000
    return `${dogePerKb} DOGE/KB`
  }
  return `${rate} sat/vB`
}

// 格式化费用显示
const formatFee = (chain: SupportedChain, fee: number) => {
  if (chain === 'doge') {
    return prettifyBalanceFixed(fee, 'DOGE', 8)
  } else if (chain === 'mvc') {
    return prettifyBalanceFixed(fee, 'SPACE', 8)
  }
  return prettifyBalanceFixed(fee, 'BTC', 8)
}
</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="bg-white">
      <DrawerHeader class="pb-2">
        <div class="text-center">
          <div class="text-lg font-medium">Confirm Teleport</div>
          <div class="text-sm text-gray-500 mt-1">
            Cross-chain transfer MRC-20 Token
          </div>
        </div>
      </DrawerHeader>
      
      <div class="px-4 pb-4">
        <!-- Token 信息 -->
        <div class="flex items-center justify-center gap-3 py-4">
          <AssetLogo
            :logo="asset.icon"
            :symbol="asset.symbol"
            :chain="fromChain"
            type="network"
            class="w-12"
          />
          <div class="text-xl font-medium">
            {{ amount }} {{ asset.symbol }}
          </div>
        </div>

        <Divider class="my-3" />

        <!-- 链路信息 -->
        <div class="flex items-center justify-center gap-4 py-4">
          <!-- From Chain -->
          <div class="flex flex-col items-center">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              :style="{ backgroundColor: getChainColor(fromChain) }"
            >
              {{ fromChain.toUpperCase().charAt(0) }}
            </div>
            <div class="text-sm mt-2">{{ getChainDisplayName(fromChain) }}</div>
          </div>
          
          <!-- Arrow -->
          <ArrowRightIcon class="w-6 h-6 text-gray-400" />
          
          <!-- To Chain -->
          <div class="flex flex-col items-center">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              :style="{ backgroundColor: getChainColor(toChain) }"
            >
              {{ toChain.toUpperCase().charAt(0) }}
            </div>
            <div class="text-sm mt-2">{{ getChainDisplayName(toChain) }}</div>
          </div>
        </div>

        <Divider class="my-3" />

        <!-- 费用详情 -->
        <div class="space-y-3 text-sm">
          <FlexBox ai="center" jc="between">
            <div class="text-gray-500">Amount</div>
            <div>{{ amount }} {{ asset.symbol }}</div>
          </FlexBox>
          
          <FlexBox ai="center" jc="between">
            <div class="text-gray-500">{{ fromChain.toUpperCase() }} Fee Rate</div>
            <div>{{ formatFeeRate(fromChain, fromFeeRate) }}</div>
          </FlexBox>
          
          <FlexBox ai="center" jc="between">
            <div class="text-gray-500">{{ toChain.toUpperCase() }} Fee Rate</div>
            <div>{{ formatFeeRate(toChain, toFeeRate) }}</div>
          </FlexBox>
          
          <Divider class="my-2" />
          
          <FlexBox ai="center" jc="between" v-if="estimatedFee">
            <div class="text-gray-500">{{ fromChain.toUpperCase() }} Network Fee</div>
            <div>{{ formatFee(fromChain, estimatedFee.fromChainFee) }}</div>
          </FlexBox>
          
          <FlexBox ai="center" jc="between" v-if="estimatedFee">
            <div class="text-gray-500">{{ toChain.toUpperCase() }} Network Fee</div>
            <div>{{ formatFee(toChain, estimatedFee.toChainFee) }}</div>
          </FlexBox>
        </div>

        <!-- 提示信息 -->
        <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div class="text-xs text-yellow-700">
            <p class="font-medium mb-1">⚠️ Important Notice</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Teleport will create transactions on both networks</li>
              <li>The transfer may take a few minutes to complete</li>
              <li>Make sure you have enough balance for fees on both networks</li>
            </ul>
          </div>
        </div>
      </div>

      <DrawerFooter>
        <FlexBox ai="center" jc="center" :gap="3">
          <DrawerClose>
            <Button type="light" class="w-[120px] h-11">
              Cancel
            </Button>
          </DrawerClose>
          <Button
            type="primary"
            class="w-[120px] h-11"
            :disabled="loading"
            @click="handleConfirm"
          >
            <div class="flex items-center gap-2" v-if="loading">
              <LoadingIcon class="w-4 h-4" />
              <span>Processing</span>
            </div>
            <span v-else>Confirm</span>
          </Button>
        </FlexBox>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
