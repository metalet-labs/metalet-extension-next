<script setup lang="ts">
import { computed } from 'vue'
import { toTx } from '@/lib/helpers'
import { useRoute } from 'vue-router'
import { getBrowserHost } from '@/lib/host'
import LinkIcon from '@/assets/icons-v3/link.svg'
import { FlexBox, Divider, Button } from '@/components'
import SuccessPNG from '@/assets/icons-v3/send-success.png'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'
import { ArrowRightIcon } from '@heroicons/vue/24/solid'
import { getChainDisplayName, getChainColor, type SupportedChain } from '@/lib/actions/teleport'
import type { Chain } from '@/lib/types'

const route = useRoute()

const transferTxId = route.params.transferTxId as string
const arrivalTxId = route.params.arrivalTxId as string
const fromChain = route.params.fromChain as SupportedChain
const toChain = route.params.toChain as SupportedChain
const symbol = route.params.symbol as string
const amount = route.params.amount as string
const genesis = route.query.genesis as string
const prepareTxId = route.query.prepareTxId as string | undefined

const { getIcon } = useIconsStore()
const logo = computed(() => {
  return getIcon(CoinCategory.MRC20, genesis || symbol) || ''
})

// 跳转到区块浏览器
const toScanUrl = async (txId: string, chain: SupportedChain) => {
  const chainMap: Record<SupportedChain, Chain> = {
    btc: 'btc',
    doge: 'doge',
    mvc: 'mvc',
  }
  const host = await getBrowserHost(chainMap[chain])
  toTx(txId, host as string)
}
</script>

<template>
  <FlexBox d="col" ai="center" class="relative w-full h-full gap-y-4 pt-12 px-4">
    <img :src="SuccessPNG" alt="Teleport Success" class="w-24" />
    <div class="text-lg font-medium">{{ $t('Teleport.Success') }}</div>
    <div class="text-sm text-gray-500">{{ $t('Teleport.CrossChainCompleted') }}</div>
    
    <!-- Token 和金额 -->
    <div class="flex flex-col items-center justify-center border border-gray-soft py-3 px-4 rounded-lg w-full">
      <FlexBox ai="center" :gap="1">
        <img v-if="logo" :src="logo" :alt="symbol" class="w-5 h-5" />
        <div v-else class="w-5 h-5 leading-5 rounded-full text-center text-white text-xs bg-blue-primary">
          {{ symbol[0].toLocaleUpperCase() }}
        </div>
        <div class="font-medium">{{ amount }} {{ symbol }}</div>
      </FlexBox>
      
      <Divider :dashed="true" class="my-3 border-gray-soft w-full" />
      
      <!-- 链路信息 -->
      <div class="flex items-center justify-center gap-3 w-full">
        <!-- From Chain -->
        <div class="flex flex-col items-center flex-1">
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            :style="{ backgroundColor: getChainColor(fromChain) }"
          >
            {{ fromChain.toUpperCase().charAt(0) }}
          </div>
          <div class="text-xs mt-1 text-gray-600">{{ getChainDisplayName(fromChain) }}</div>
        </div>
        
        <!-- Arrow -->
        <ArrowRightIcon class="w-5 h-5 text-gray-400 flex-shrink-0" />
        
        <!-- To Chain -->
        <div class="flex flex-col items-center flex-1">
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            :style="{ backgroundColor: getChainColor(toChain) }"
          >
            {{ toChain.toUpperCase().charAt(0) }}
          </div>
          <div class="text-xs mt-1 text-gray-600">{{ getChainDisplayName(toChain) }}</div>
        </div>
      </div>
    </div>
    
    <!-- 交易详情 -->
    <div class="w-full space-y-2 text-sm">
      <!-- Prepare 交易 (源链，如果有) -->
      <div 
        v-if="prepareTxId" 
        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div class="text-gray-600">{{ fromChain.toUpperCase() }} {{ $t('Teleport.Prepare') }}</div>
        <div 
          class="flex items-center gap-1 text-blue-primary hover:underline cursor-pointer text-xs"
          @click="toScanUrl(prepareTxId, fromChain)"
        >
          <span>{{ prepareTxId.slice(0, 8) }}...{{ prepareTxId.slice(-8) }}</span>
          <LinkIcon class="w-3 h-3" />
        </div>
      </div>
      
      <!-- Transfer 交易 (源链) -->
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="text-gray-600">{{ fromChain.toUpperCase() }} Transfer</div>
        <div 
          class="flex items-center gap-1 text-blue-primary hover:underline cursor-pointer text-xs"
          @click="toScanUrl(transferTxId, fromChain)"
        >
          <span>{{ transferTxId.slice(0, 8) }}...{{ transferTxId.slice(-8) }}</span>
          <LinkIcon class="w-3 h-3" />
        </div>
      </div>
      
      <!-- Arrival 交易 (目标链) -->
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="text-gray-600">{{ toChain.toUpperCase() }} Arrival</div>
        <div 
          class="flex items-center gap-1 text-blue-primary hover:underline cursor-pointer text-xs"
          @click="toScanUrl(arrivalTxId, toChain)"
        >
          <span>{{ arrivalTxId.slice(0, 8) }}...{{ arrivalTxId.slice(-8) }}</span>
          <LinkIcon class="w-3 h-3" />
        </div>
      </div>
    </div>
    
    <div class="flex-1"></div>
    
    <Button type="primary" @click="$router.replace('/wallet')" class="w-full h-12 mb-4">
      {{ $t('Common.Done') }}
    </Button>
  </FlexBox>
</template>

<style lang="css" scoped>
.label {
  @apply text-xs text-gray-primary;
}
</style>
