<script lang="ts" setup>
import { ref } from 'vue'
import * as bip39 from '@scure/bip39'
import { FlexBox } from '@/components'
import passwordManager from '@/lib/password'
import { CreatePassword, Activate } from './components'
import { wordlist } from '@scure/bip39/wordlists/english'

const step = ref(1)
const stepLen = ref(2)
const hasPassword = ref(false)
const words = bip39.generateMnemonic(wordlist).split(' ')

passwordManager.has().then((_hasPassword) => {
  if (_hasPassword) {
    hasPassword.value = true
    stepLen.value = 1
  }
})
</script>

<template>
  <FlexBox d="col" class="w-full gap-20">
    <FlexBox ai="center" jc="center" class="w-full h-[70px]" :gap="2">
      <FlexBox
        ai="center"
        jc="center"
        :class="['step-circle', step === _step ? 'active' : undefined]"
        v-for="_step in Array.from({ length: stepLen }, (_, i) => i + 1)"
      >
        {{ _step }}
      </FlexBox>
    </FlexBox>
    <FlexBox jc="center" class="w-full">
      <CreatePassword
        v-if="!hasPassword"
        :callback="
          () => {
            step = step + 1
            hasPassword = true
          }
        "
      />
      <Activate v-else-if="step === stepLen" :words="words" :mvcTypes="[10001]" type="create" />
    </FlexBox>
  </FlexBox>
</template>

<style scoped>
.step-circle {
  @apply w-6 h-6 bg-gray-secondary text-gray-primary rounded-full text-ss cursor-pointer;
}

.step-circle.active {
  @apply bg-blue-primary text-white;
}

button[aria-selected='true'] {
  @apply bg-white text-blue-primary rounded-md;
}

div[role='tabpanel'][data-state='active'] {
  @apply mt-4;
}

button[role='combobox'] {
  @apply border-none focus:ring-0 p-0;
}
</style>
