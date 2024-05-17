<script lang="ts" setup>
import { computed, ref } from 'vue'
import { passwordStrength } from 'check-password-strength'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  password: string
  title?: string
  error?: string
  validate?: boolean
}>()

const isCovered = ref(true)
const emit = defineEmits(['update:password'])
const passwordInputType = computed(() => (isCovered.value ? 'password' : 'text'))

const securityLevel = computed(() => passwordStrength(props.password).value)

const securityColor = computed(() => {
  if (['Too weak', 'Weak'].includes(securityLevel.value)) {
    return '#FA5151'
  } else if (securityLevel.value === 'Medium') {
    return '#FF8F1F'
  } else if (securityLevel.value === 'Strong') {
    return '#07C28C'
  }
})

const levelColors = computed(() => {
  if (!props.password) {
    return ['bg-transparent', 'bg-transparent', 'bg-transparent']
  }
  if (securityLevel.value === 'Strong') {
    return ['bg-[#07C28C]', 'bg-[#07C28C]', 'bg-[#07C28C]']
  } else if (securityLevel.value === 'Medium') {
    return ['bg-[#FF8F1F]', 'bg-[#FF8F1F]', 'bg-[#EBEBEB]']
  } else if (securityLevel.value === 'Weak') {
    return ['bg-[#FA5151]', 'bg-[#FA5151]', 'bg-[#EBEBEB]']
  } else if (securityLevel.value === 'Too weak') {
    return ['bg-[#FA5151]', 'bg-[#FA5151]', 'bg-[#FA5151]']
  }
})
</script>

<template>
  <form @submit.prevent>
    <h4 class="mb-2 text-sm">{{ title || 'Password' }}</h4>
    <div class="relative">
      <input
        name="password"
        autocomplete="on"
        :type="passwordInputType"
        @input="(event) => emit('update:password', (event.target as HTMLInputElement).value)"
        :class="[
          'block w-full rounded-md border border-gray-soft outline-blue-primary p-4 pr-12',
          { 'border-red-500': !!error },
        ]"
      />
      <div class="absolute right-0 top-0 flex h-full items-center pr-4">
        <button type="button" @click="isCovered = !isCovered">
          <EyeIcon v-if="isCovered" class="h-5 w-5 text-gray-400 transition hover:text-blue-500" />
          <EyeSlashIcon v-else class="h-5 w-5 text-gray-400 transition hover:text-blue-500" />
        </button>
      </div>
      <div class="absolute -bottom-8 left-0 flex items-center justify-between w-full text-sm" v-if="validate">
        <div class="flex items-center gap-1">
          <div :class="['w-8 h-1.5 rounded-md', bgColor]" v-for="(bgColor, index) in levelColors" :key="index"></div>
        </div>
        <div v-if="password">
          <span :class="[securityColor]">{{ securityLevel }}</span>
        </div>
      </div>
      <p v-if="error" class="absolute -bottom-8 left-0 text-sm text-red-500">{{ error }}</p>
    </div>
  </form>
</template>
