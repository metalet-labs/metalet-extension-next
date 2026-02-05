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
    <DrawerContent class="bg-white max-h-[85vh] overflow-y-auto">
      <DrawerHeader class="pb-2 flex-shrink-0">
        <div class="text-center">
          <div class="text-lg font-medium">Confirm Teleport</div>
          <div class="text-sm text-gray-500 mt-1">
            Cross-chain transfer MRC-20 Token
          </div>
        </div>
      </DrawerHeader>
      
      <div class="px-4 pb-4 flex-1 overflow-y-auto">
        <!-- Token 信息 -->
        <div class="flex items-center justify-center gap-3 py-3">
          <AssetLogo
            :logo="asset.icon"
            :symbol="asset.symbol"
            :chain="fromChain"
            type="network"
            class="w-10"
          />
          <div class="text-lg font-medium">
            {{ amount }} {{ asset.symbol }}
          </div>
        </div>

        <Divider class="my-2" />

        <!-- 链路信息 -->
        <div class="flex items-center justify-center gap-4 py-3">
          <!-- From Chain -->
          <div class="flex flex-col items-center">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              :style="{ backgroundColor: getChainColor(fromChain) }"
            >
              {{ fromChain.toUpperCase().charAt(0) }}
            </div>
            <div class="text-xs mt-1">{{ getChainDisplayName(fromChain) }}</div>
          </div>
          
          <!-- Arrow -->
          <ArrowRightIcon class="w-5 h-5 text-gray-400" />
          
          <!-- To Chain -->
          <div class="flex flex-col items-center">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              :style="{ backgroundColor: getChainColor(toChain) }"
            >
              {{ toChain.toUpperCase().charAt(0) }}
            </div>
            <div class="text-xs mt-1">{{ getChainDisplayName(toChain) }}</div>
          </div>
        </div>

        <Divider class="my-2" />

        <!-- 费用详情 -->
        <div class="space-y-2 text-sm">
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
          
          <Divider class="my-1" />
          
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
        <div class="mt-3 p-2 bg-yellow-50 rounded-lg">
          <div class="text-xs text-yellow-700">
            <p>⚠️ Teleport creates transactions on both networks. Make sure you have enough balance for fees.</p>
          </div>
        </div>
      </div>

      <DrawerFooter class="flex-shrink-0 pt-2 pb-4">
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
