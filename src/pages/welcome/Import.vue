<script lang="ts" setup>
import { ref } from 'vue'
import passwordManager from '@/lib/password'
import { CreatePassword, SelectMvcPath, ImportPhrase, Activate } from './components'

const step = ref(1)
const stepLen = ref(3)
const mvcTypes = ref([10001])
const hasPassword = ref(false)
const chooseMVCAddress = ref(false)
const words = ref<string[]>(Array(12).fill(''))

const nextStep = () => {
  if (step.value === stepLen.value) {
    return
  }
  step.value += 1
}

passwordManager.has().then((_hasPassword) => {
  if (_hasPassword) {
    stepLen.value -= 1
  }
  hasPassword.value = _hasPassword
})
</script>

<template>
  <div class="flex flex-col w-full gap-20">
    <div class="flex items-center justify-center gap-2 w-full h-[70px]">
      <div
        v-for="_step in Array.from({ length: stepLen }, (_, i) => i + 1)"
        :class="['flex items-center justify-center step-circle', { active: step === _step }]"
      >
        {{ _step }}
      </div>
    </div>
    <div class="flex justify-center w-full">
      <ImportPhrase @nextStep="nextStep" v-model:words="words" v-if="step === 1" />

      <CreatePassword
        v-else-if="!hasPassword"
        :callback="
          () => {
            step = step + 1
            hasPassword = true
          }
        "
      />

      <Activate
        type="Import"
        :words="words"
        :mvcTypes="mvcTypes"
        v-else-if="step === stepLen"
        @openSelectMvcPath="chooseMVCAddress = true"
      />
      <SelectMvcPath
        :words="words"
        v-if="chooseMVCAddress"
        v-model:mvcTypes="mvcTypes"
        class="z-10 absolute bg-white"
        @close="chooseMVCAddress = false"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.step-circle) {
  @apply w-6 h-6 bg-gray-secondary text-gray-primary rounded-full text-ss cursor-pointer;
}

:deep(.step-circle.active) {
  @apply bg-blue-primary text-white;
}
</style>
