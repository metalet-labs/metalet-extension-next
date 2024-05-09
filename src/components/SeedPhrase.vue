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
    default: false,
  },
})
</script>

<template>
  <div :class="['grid grid-cols-2 gap-2 pr-3 -mr-3 overflow-y-auto max-h-[304px]', { 'no-copy': noCopied }]">
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

<style scoped>
.no-copy {
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */
}
</style>
