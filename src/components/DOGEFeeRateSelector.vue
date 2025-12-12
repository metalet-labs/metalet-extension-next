<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CloseIcon from '@/assets/icons-v3/close.svg'
import { getDogeFeeRates, type DogeFeeRate } from '@/queries/doge'
import { FlexBox, Button } from '@/components'
import SelectIcon from '@/assets/icons-v3/select_active.svg'
import ArrowRightIcon from '@/assets/icons-v3/arrow_right.svg'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

const open = ref(false)
const isCustom = ref(false)
const selectedIndex = ref(-1)
const feeRate = ref<number>()
const rateList = ref<DogeFeeRate[]>([])
const emit = defineEmits(['update:currentRateFee'])

const rateOnChange = (_feeRate: number | undefined, index: number) => {
  feeRate.value = _feeRate
  selectedIndex.value = index
  emit('update:currentRateFee', _feeRate)
}

onMounted(() => {
  rateList.value = getDogeFeeRates()
  // Default to Avg
  const avgIndex = rateList.value.findIndex((item) => item.title === 'Avg')
  if (avgIndex !== -1) {
    rateOnChange(rateList.value[avgIndex].feeRate, avgIndex)
  }
})

const selectRateFee = (rateFee: number, index: number) => {
  isCustom.value = false
  rateOnChange(rateFee, index)
}

const selectCustom = () => {
  isCustom.value = true
  rateOnChange(undefined, -1)
}

// Format fee rate for display (convert from sat/KB to DOGE/KB)
const formatFeeRate = (rate: number) => {
  const dogePerKb = rate / 100000000
  return `${dogePerKb} DOGE/KB`
}
</script>

<template>
  <FlexBox ai="center" jc="between">
    <FlexBox ai="center" jc="between" @click="open = true" class="w-full cursor-pointer">
      <div class="text-sm">{{ $t('Common.FeeRate') }}</div>
      <FlexBox ai="center" jc="center" class="text-xs text-gray-primary">
        <span>{{ feeRate ? formatFeeRate(feeRate) : '...' }}</span>
        <ArrowRightIcon class="text-gray-primary" />
      </FlexBox>
    </FlexBox>
    <Drawer v-model:open="open">
      <DrawerContent class="bg-white">
        <DrawerHeader class="pt-1.5 pb-3.5 py-4">
          <DrawerTitle class="text-center text-sm relative">
            <span>Select Fee Rate</span>
            <DrawerClose>
              <CloseIcon class="absolute top-0 right-0 cursor-pointer" />
            </DrawerClose>
          </DrawerTitle>
        </DrawerHeader>
        <div class="p-4">
          <div class="grid grid-cols-3 gap-2 text-xs">
            <FlexBox
              d="col"
              :gap="1"
              ai="center"
              jc="center"
              v-for="(rate, index) in rateList"
              @click="selectRateFee(rate.feeRate, index)"
              class="rounded-md border cursor-pointer aspect-square relative"
              :class="index === selectedIndex ? 'border-blue-primary' : 'border-gary-soft'"
            >
              <SelectIcon v-if="index === selectedIndex" class="absolute top-1 right-1" />
              <span class="text-black-primary">{{ rate.title }}</span>
              <span :class="index === selectedIndex ? 'text-blue-primary' : 'text-gray-primary'">{{
                formatFeeRate(rate.feeRate)
              }}</span>
              <span class="text-gray-primary">{{ rate.desc }}</span>
            </FlexBox>
          </div>
          <FlexBox
            d="col"
            :gap="2"
            ai="center"
            jc="center"
            @click="selectCustom"
            class="mt-2 cursor-pointer rounded-md border px-3 py-2 relative"
            :class="isCustom ? 'border-blue-primary' : 'border-gary-soft'"
          >
            <SelectIcon v-if="isCustom" class="absolute top-1 right-1" />
            <span class="text-black-primary">Custom</span>
            <input
              v-if="isCustom"
              type="number"
              min="100000"
              placeholder="100000"
              class="text-center text-gray-primary"
              @input="(e) => rateOnChange(Number((e.target as HTMLInputElement).value), -1)"
            />
          </FlexBox>
        </div>
        <DrawerFooter class="pt-4">
          <DrawerClose>
            <Button type="primary" class="w-full">{{ $t('Common.Confirm') }}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </FlexBox>
</template>

<style scoped lang="css">
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
