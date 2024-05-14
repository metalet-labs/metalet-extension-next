<script lang="ts" setup>
defineProps({
  edit: {
    type: Boolean,
    required: false,
    default: true,
  },
  words: {
    type: Array,
    required: true,
  },
  onPasteWords: {
    type: Function,
    required: false,
  },
  noCopied: {
    type: Boolean,
    required: false,
  },
})
</script>

<template>
  <div :class="['grid grid-cols-2 gap-2 pr-3 -mr-3 overflow-y-auto max-h-[304px]', { 'select-none': noCopied }]">
    <div class="flex items-center h-11 border-gray-soft border rounded-lg" v-for="(_, index) in words" :key="index">
      <div class="flex items-center justify-center w-7.5 h-full text-gray-primary bg-gray-secondary rounded-l-lg">
        {{ index + 1 }}
      </div>
      <input
        type="text"
        v-if="edit"
        v-model="words[index]"
        @paste.prevent="onPasteWords!"
        class="h-full font-medium w-full p-3 rounded-lg focus:outline-none focus:ring-0"
      />
      <div v-else class="h-full font-medium w-full p-3 rounded-lg focus:outline-none focus:ring-0 leading-4">
        {{ words[index] }}
      </div>
    </div>
  </div>
</template>
