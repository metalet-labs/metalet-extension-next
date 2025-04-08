<script setup lang="ts">
import Ticker from './Ticker.vue'
import { ref, computed } from 'vue'
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import { type TokenTransfer } from '@/queries/brc20'
import ArrowDownIcon from '@/assets/icons-v3/arrow_down.svg'
import { LoadingText, Divider, FlexBox } from '@/components'

const props = defineProps<{
  loading: boolean
  list?: TokenTransfer[]
  clickEvent?: Function
}>()

const showAll = ref(false)

const tickerList = computed(() => {
  if (props.list) {
    if (showAll.value) {
      return props.list
    } else {
      return props.list.slice(0, 3)
    }
  }
})
</script>

<template>
  <div class="overflow-y-auto">
    <LoadingText v-if="props.loading" text="Transferable Token Loading..." />
    <template v-else-if="tickerList?.length">
      <div :class="['grid grid-cols-3 gap-x-2 gap-y-4', props.clickEvent ? 'cursor-pointer' : undefined]">
        <Ticker
          :ticker="ticker.ticker"
          :amount="ticker.amount"
          :key="ticker.inscriptionId"
          v-for="ticker in tickerList"
          :inscriptionNumber="ticker.inscriptionNumber"
          @click="props.clickEvent ? props.clickEvent(ticker.inscriptionId, ticker.amount) : undefined"
        />
      </div>
      <template v-if="!showAll && props.list && props.list.length > 3">
        <Divider :w="2" class="mt-4 mb-3 border-gray-soft" />

        <!-- TODO: Add show all -->
        <!-- @click="showAll = true" -->
        <FlexBox :w="2" ai="center" jc="center" class="text-xs cursor-pointer text-gray-primary gap-x-0.5">
          <span>{{ $t('Common.All') }}</span>
          <ArrowDownIcon />
        </FlexBox>
      </template>
    </template>
    <div v-else class="pt-6 pb-8">
      <EmptyIcon class="mx-auto" />
    </div>
  </div>
</template>

<style scoped lang="css"></style>
