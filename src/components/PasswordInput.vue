<script lang="ts" setup>
import { computed, ref } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid'

defineProps<{
  error: string
  password: string
}>()

const isCovered = ref(true)
const emit = defineEmits(['update:password'])
const passwordInputType = computed(() => (isCovered.value ? 'password' : 'text'))
</script>

<template>
  <form @submit.prevent>
    <h4 class="mb-2 text-sm">Password</h4>
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
      <p v-if="error" class="absolute -bottom-8 left-0 text-sm text-red-500">{{ error }}</p>
    </div>
  </form>
</template>
