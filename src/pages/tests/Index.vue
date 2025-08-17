<script setup lang="ts">
import { ref } from 'vue'
import { getPassword } from '@/lib/lock'
import { process } from '@/lib/actions/small-pay'

const result = ref()
const inputValue = ref('')

const handleClick = async () => {
  
}
</script>

<template>
  <div class="w-full py-2 flex flex-col items-center justify-center">
    <textarea v-model="inputValue" type="text" class="my-16 p-2 border border-gray-300 rounded w-[600px]" rows="4"
      placeholder="输入内容" />
    <button class="text-lg mb-4 p-2 bg-blue-500 text-white rounded" @click="handleClick">Get Data</button>
    <div v-if="result" class="p-4 border border-gray-300 rounded w-[600px]">
      <p>
        <strong>sharedSecret:</strong>
        {{ result.sharedSecret }}
      </p>
      <p>
        <strong>privateKey:</strong>
        {{ result.privateKey }}
      </p>
      <p class="break-all">
        <strong>externalPubKey:</strong>
        {{ result.externalPubKey }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="css"></style>
