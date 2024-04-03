<script setup lang="ts">
import { migrateToV3 } from '@/lib/migrate'
import { WalletManager } from 'utxo-wallet-service'

const test = () => {}
</script>

<template>
  <div class="w-full py-2 flex items-center justify-center">
    <button class="text-lg" @click="migrateToV3">test</button>
  </div>
</template>

<style scoped lang="css"></style>
