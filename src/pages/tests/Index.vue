<script setup lang="ts">
import { ref } from 'vue'
import { getPassword } from '@/lib/lock'
import { process } from '@/lib/actions/common/ecdh'

const result = ref()
const inputValue = ref('')

const handleClick = async () => {
  const { sharedSecret, externalPubKey,ecdhPubKey } = await process({
    externalPubKey: "048add0a6298f10a97785f7dd069eedb83d279a6f03e73deec0549e7d6fcaac4eef2c279cf7608be907a73c89eb44c28db084c27b588f1bd869321a6f104ec642d",
  }, {
    password: await getPassword()
  })
  result.value = { sharedSecret, externalPubKey,ecdhPubKey }
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
      
      <p class="break-all">
        <strong>externalPubKey:</strong>
        {{ result.externalPubKey }}
      </p>
      <p>
        <strong>privateKey:</strong>
        {{ result.privateKey }}
      </p>
      <p class="break-all">
        <strong>ecdhPubKey:</strong>
        {{ result.ecdhPubKey }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="css"></style>
