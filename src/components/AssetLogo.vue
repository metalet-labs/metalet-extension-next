<script setup lang="ts">
import { type Chain } from '@/lib/types'
import { UseImage } from '@vueuse/components'
import IncomeLogo from '@/assets/icons-v3/income.svg'
import ExpenseLogo from '@/assets/icons-v3/expense.svg'
import BTCNetworkLogo from '@/assets/icons-v3/network_btc.svg'
import MVCNetworkLogo from '@/assets/icons-v3/network_mvc.svg'

withDefaults(
  defineProps<{
    logo?: string
    chain?: Chain
    symbol?: string
    bgColor?: string
    logoSize?: string
    type?: 'network' | 'activity'
    flow?: 'Send' | 'Receive' | 'Transfer' | string
  }>(),
  {
    logoSize: 'size-6',
  }
)
</script>

<template>
  <div class="relative text-3xl">
    <UseImage :src="logo!" class="w-full aspect-square rounded-full shadow" :key="logo">
      <template #loading>
        <div
          :class="[
            'aspect-square flex items-center justify-center rounded-full text-white shrink-0 shadow',
            bgColor ?? 'bg-blue-primary',
          ]"
        >
          {{ symbol?.[0]?.toLocaleUpperCase() }}
        </div>
      </template>
      <template #error>
        <div
          class="aspect-square flex items-center justify-center rounded-full text-white bg-blue-primary shrink-0 shadow"
        >
          {{ symbol?.[0]?.toLocaleUpperCase() }}
        </div>
      </template>
    </UseImage>

    <template v-if="type === 'network'">
      <BTCNetworkLogo v-if="chain === 'btc'" :class="['absolute bottom-0 right-0', logoSize]" />
      <MVCNetworkLogo v-else-if="chain === 'mvc'" :class="['absolute bottom-0 right-0', logoSize]" />
    </template>
    <template v-else-if="type === 'activity'">
      <IncomeLogo v-if="flow === 'Receive'" :class="['absolute bottom-0 right-0', logoSize]" />
      <ExpenseLogo v-else-if="flow === 'Send'" :class="['absolute bottom-0 right-0', logoSize]" />
    </template>
  </div>
</template>

<style scoped lang="css"></style>
