<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { getV3Wallets } from '@/lib/wallet'
import BrushIcon from '@/assets/icons-v3/brush.svg'
import { FlexBox, Button, SeedPhrase } from '@/components'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
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
  error.value = ''
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

const next = async () => {
  const wallets = await getV3Wallets()
  const hasWallet = wallets.find((wallet) => wallet.mnemonic === props.words.join(' '))
  if (hasWallet) {
    error.value = 'Wallet already exists.'
    return
  }
  emit('nextStep')
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
      <ArrowLeftIcon @click="$router.go(-1)" class="cursor-pointer w-3.5" />
      <div class="text-2xl font-medium">Import Wallet</div>
    </FlexBox>
    <Tabs default-value="phrase" class="w-full">
      <TabsList class="grid grid-cols-2 bg-gray-secondary rounded-lg text-gray-primary" v-if="false">
        <TabsTrigger value="phrase" class="text-xs">Import Phrase</TabsTrigger>
        <TabsTrigger value="privateKey" class="text-xs" disabled>Import Private Key</TabsTrigger>
      </TabsList>
      <TabsContent value="phrase">
        <FlexBox d="col" :gap="4">
          <FlexBox ai="center" :gap="1">
            <span>My mnemonic phrase is</span>
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

          <SeedPhrase :onPasteWords="onPasteWords" :words="words" />

          <Button
            @click="next"
            type="primary"
            :disabled="!finished || !!error"
            :class="['w-61.5 mt-15 mx-auto', { 'cursor-not-allowed opacity-50': !finished || error }]"
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
              placeholder="Paste or enter your private key."
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
