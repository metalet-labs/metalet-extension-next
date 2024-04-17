<script setup lang="ts">
import Ticker from './Ticker.vue'
import { ref, computed } from 'vue'
import { type TokenTransfer } from '@/queries/btc'
import EmptyIcon from '@/assets/icons-v3/empty.svg'
import { LoadingText, Divider, FlexBox } from '@/components'
import ArrowDwonIcon from '@/assets/icons-v3/arrow_down.svg'

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
  <div>
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
      <template v-if="!showAll">
        <Divider :w="2" class="mt-4 mb-3 border-gray-soft" />
        <FlexBox
          :w="2"
          ai="center"
          jc="center"
          @click="showAll = true"
          class="text-xs cursor-pointer text-gray-primary gap-x-0.5"
        >
          <span>All</span>
          <ArrowDwonIcon />
        </FlexBox>
      </template>
    </template>
    <div v-else class="pt-6 pb-8">
      <EmptyIcon class="mx-auto" />
    </div>
  </div>
</template>

<style scoped lang="css"></style>
