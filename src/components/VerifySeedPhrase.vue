<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  randomNum: {
    type: Number,
    required: true,
  },
  words: {
    type: Array,
    required: true,
  },
})

const randomWords = ref<string[]>([])
const randomIndices = ref<number[]>([])

onMounted(() => {
  const indices = new Set<number>()
  for (let i = 0; i < props.randomNum; i++) {
    const randomIndex = Math.floor(Math.random() * props.words.length)
    if (!indices.has(randomIndex)) {
      indices.add(randomIndex)
    } else {
      i--
    }
  }
  randomIndices.value = Array.from(indices).sort((a, b) => a - b)
  randomWords.value = Array(props.randomNum).fill('')
})

const confirm = () => {
  for (let i = 0; i < randomIndices.value.length; i++) {
    if (randomWords.value[i] !== props.words[randomIndices.value[i]]) {
      return false
    }
  }
  return true
}

defineExpose({
  confirm,
})
</script>

<template>
  <div class="grid grid-cols-2 gap-2 pr-3 -mr-3 overflow-y-auto max-h-[304px]">
    <div
      :key="randomIndex"
      v-for="(randomIndex, index) in randomIndices"
      class="flex items-center h-11 border-gray-soft border rounded-lg"
    >
      <div class="flex items-center justify-center w-7.5 h-full text-gray-primary bg-gray-secondary rounded-l-lg">
        {{ randomIndex + 1 }}
      </div>
      <input
        type="text"
        v-model="randomWords[index]"
        class="h-full font-medium w-full p-3 rounded-lg focus:outline-none focus:ring-0"
      />
    </div>
  </div>
</template>
