<script lang="ts" setup>
import { FlexBox, Button } from '@/components'
import BrushIcon from '@/assets/icons-v3/brush.svg'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
import { ref, computed, watch, defineEmits, defineProps } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps({
  words: {
    type: Array<string>,
    required: true,
  },
})

const wordsLen = ref('12')
const error = ref<string>()
const wordsLengths = [12, 15, 18, 21, 24]
const finished = computed(() => props.words.every((word) => word.length > 0))

const emit = defineEmits(['nextStep'])

const clearWords = () => {
  props.words.splice(0, props.words.length, ...Array(Number(wordsLen.value)).fill(''))
}

const onPasteWords = (e: ClipboardEvent) => {
  error.value = ''
  const text = e.clipboardData?.getData('text')
  if (text) {
    const wordsArr = text.split(' ')
    if (wordsArr.length === Number(wordsLen.value)) {
      props.words.splice(0, props.words.length, ...wordsArr)
    } else {
      error.value = 'Invalid secret phrase. Please check and try again.'
    }
  }
}

watch(
  () => wordsLen.value,
  () => {
    clearWords()
  }
)
</script>

<template>
  <FlexBox d="col" class="w-82" :gap="6">
    <FlexBox ai="center" :gap="3">
      <ArrowLeftIcon @click="$router.go(-1)" class="cursor-pointer" />
      <div class="text-2xl font-medium">Import Wallet</div>
    </FlexBox>
    <Tabs default-value="phrase" class="w-full">
      <TabsList class="grid grid-cols-2 bg-gray-secondary rounded-lg text-gray-primary">
        <TabsTrigger value="phrase" class="text-xs">Import from Phrase</TabsTrigger>
        <TabsTrigger value="privateKey" class="text-xs">Import from PrivateKey</TabsTrigger>
      </TabsList>
      <TabsContent value="phrase">
        <FlexBox d="col" :gap="4">
          <FlexBox ai="center" :gap="1">
            <span>My seed phrase has</span>
            <Select v-model:modelValue="wordsLen">
              <SelectTrigger class="w-30 text-base">
                <SelectValue placeholder="Select a number of words" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem :value="length.toString()" v-for="length of wordsLengths">{{ length }} words</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <BrushIcon class="ml-auto text-black-secondary cursor-pointer" @click="clearWords" />
          </FlexBox>

          <!-- input phrase -->
          <div class="grid grid-cols-2 gap-2 pr-3 -mr-3 overflow-y-auto max-h-[304px]">
            <FlexBox class="h-11 border-gray-soft border rounded-lg" v-for="(_, index) in props.words" ai="center">
              <FlexBox ai="center" jc="center" class="w-7.5 h-full text-gray-primary bg-gray-secondary rounded-l-lg">
                {{ index + 1 }}
              </FlexBox>
              <input
                :key="index"
                type="text"
                v-model="props.words[index]"
                @paste.prevent="onPasteWords"
                class="h-full font-medium w-full p-3 rounded-lg focus:outline-none focus:ring-0"
              />
            </FlexBox>
          </div>

          <Button
            type="primary"
            @click="emit('nextStep')"
            :class="['w-61.5 mt-15 mx-auto', { 'cursor-not-allowed opacity-50': !finished }]"
          >
            Next
          </Button>

          <!-- error -->
          <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
        </FlexBox>
      </TabsContent>
      <TabsContent value="privateKey">
        <FlexBox d="col" :gap="4">
          <div class="h-90">
            <textarea
              disabled
              placeholder="Enter your private key here"
              class="w-full h-45 focus:outline-none border border-gray-soft rounded-lg px-4 py-3.5 cursor-not-allowed"
            />
          </div>
          <Button type="primary" class="w-61.5 mt-15 mx-auto cursor-not-allowed opacity-50" @click="null" disabled>
            Coming soon...
          </Button>
        </FlexBox>
      </TabsContent>
    </Tabs>
  </FlexBox>
</template>

<style scoped>
:deep(button[aria-selected='true']) {
  @apply bg-white text-blue-primary rounded-md;
}

:deep(div[role='tabpanel'][data-state='active']) {
  @apply mt-4;
}
</style>
