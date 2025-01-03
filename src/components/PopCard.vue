<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  level: number
}>()

const getPopComp = (level: number) => {
  let textColorClass
  let bgColorClass

  switch (level) {
    case 1:
      textColorClass = 'text-[B6B6B6]'
      bgColorClass = 'bg-gradient-to-br from-[#F5F5F5] to-[#E5E5E5]'
      break
    case 2:
      textColorClass = 'text-[#838C9B]'
      bgColorClass = 'bg-gradient-to-br from-[#FFFFFF] to-[#D6DFEB]'
      break
    case 3:
      textColorClass = 'text-[#515863]'
      bgColorClass = 'bg-gradient-to-br from-[#D7E1EA] to-[#ACBDD4]'
      break
    case 4:
      textColorClass = 'text-[#516775]'
      bgColorClass = 'bg-gradient-to-br from-[#DCEEFF] to-[#ACCBF1]'
      break
    case 5:
      textColorClass = 'text-[#5F5D87]'
      bgColorClass = 'bg-gradient-to-br from-[#F0EFFF] to-[#D1CEFF]'
      break
    case 6:
      textColorClass = 'text-[#21D9A5]'
      bgColorClass = 'bg-gradient-to-br from-[#F5FFFC] to-[#C9FFED]'
      break
    case 7:
      textColorClass = 'text-[#21AF86]'
      bgColorClass = 'bg-gradient-to-br from-[#95FFDC] to-[#6DFFCE]'
      break
    case 8:
      textColorClass = 'text-[#054734]'
      bgColorClass = 'bg-gradient-to-br from-[#8CFFD9] to-[#08EDAB]'
      break
    case 9:
      textColorClass = 'text-[#D1A65E]'
      bgColorClass = 'bg-gradient-to-br from-[#FFFBF5] to-[#FFF9EE]'
      break
    case 10:
      textColorClass = 'text-[#AC8538]'
      bgColorClass = 'bg-gradient-to-br from-[#FFF2E5] to-[#FFE5B6]'
      break
    case 11:
      textColorClass = 'text-[#5C4A15]'
      bgColorClass = 'bg-gradient-to-br from-[#FFF9EA] to-[#FCD789]'
      break
    case 12:
      textColorClass = 'text-[#3A2E0B]'
      bgColorClass = 'bg-gradient-to-br from-[#FCE19E] to-[#FABC39]'
      break
    case 13:
      textColorClass = 'text-white'
      bgColorClass = 'bg-gradient-to-br from-[#B837FD] to-[#D024A8]'
      break
    case 14:
      textColorClass = 'text-white'
      bgColorClass = 'bg-gradient-to-br from-[#FC6780] to-[#FC3232]'
      break
    default:
      textColorClass = 'text-[B6B6B6]'
      bgColorClass = 'bg-gray-light'
  }
  return { textColorClass, bgColorClass }
}

const popStyle = computed(() => getPopComp(props.level))
</script>

<template>
  <div
    :class="[
      'text-center w-10 py-0.5 text-xs rounded-tl-md rounded-br-md font-medium',
      popStyle.textColorClass,
      popStyle.bgColorClass,
    ]"
  >
    <span>Lv</span>
    <span>{{ level }}</span>
  </div>
</template>

<style scoped></style>
