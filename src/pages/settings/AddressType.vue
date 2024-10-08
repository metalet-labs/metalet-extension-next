<script lang="ts" setup>
import { ref } from 'vue'
import { scripts } from '@/lib/bip32-deriver'
import { getCurrentAccount, updateBtcPath } from '@/lib/account'
import { RadioGroup, RadioGroupLabel, RadioGroupDescription, RadioGroupOption } from '@headlessui/vue'

const mvcPath = ref('')
const selected = ref(scripts[0])
getCurrentAccount().then((account) => {
  if (!account) {
    return
  }
  let index = scripts.findIndex((script) => script.addressType === (account.btc.addressType || 'P2PKH'))
  if (index === 3) {
    // determine if the mvc path is the same as the btc path
    if (account.mvc.path === account.btc.path) {
      index = 4
    }
  }
  selected.value = scripts[index]
  mvcPath.value = account.mvc.path
})

const onUpdateBtcPath = async (script: (typeof scripts)[number]) => {
  selected.value = script
  if (script.name === 'Same as MVC') {
    await updateBtcPath(mvcPath.value)
  } else {
    await updateBtcPath(script.path)
  }
}
</script>

<template>
  <div class="mt-2 w-full px-4">
    <div class="mx-auto w-full max-w-md">
      <RadioGroup v-model="selected">
        <RadioGroupLabel class="sr-only">BTC Address Type</RadioGroupLabel>
        <div class="space-y-4">
          <RadioGroupOption
            as="template"
            v-for="script in scripts"
            :key="script.name"
            :value="script"
            v-slot="{ checked }"
          >
            <div
              @click="onUpdateBtcPath(script)"
              :class="[checked ? ' ' : 'bg-gray-50']"
              class="relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none"
              :style="checked ? 'background: linear-gradient(98deg, #72F5F6 4%, #171AFF 94%)' : ''"
            >
              <div class="flex w-full items-center justify-between">
                <div class="flex items-center">
                  <div class="text-sm">
                    <RadioGroupLabel as="p" :class="checked ? 'text-white' : 'text-gray-900'">
                      {{ script.name }}
                    </RadioGroupLabel>
                    <RadioGroupDescription as="span" :class="checked ? 'text-sky-100' : 'text-gray-500'" class="inline">
                      <span> {{ script.addressType }}</span>
                      <span aria-hidden="true"> &middot; </span>
                      <span>{{ script.name === 'Same as MVC' ? mvcPath : script.path }}</span>
                    </RadioGroupDescription>
                  </div>
                </div>
                <div v-show="checked" class="shrink-0 text-white">
                  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#fff" fill-opacity="0.2" />
                    <path
                      d="M7 13l3 3 7-7"
                      stroke="#fff"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </RadioGroupOption>
        </div>
      </RadioGroup>
    </div>
  </div>
</template>
