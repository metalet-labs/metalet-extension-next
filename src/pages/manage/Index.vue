<script setup lang="ts">
import { totalBalance } from '@/lib/balance'
import { FlexBox, Divider } from '@/components'
import { WalletsStore } from '@/stores/WalletStore'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'

const manager = WalletsStore.walletManager
</script>

<template>
  <FlexBox class="w-full py-2" d="col">
    <FlexBox class="px-4 py-6 w-full" ai="center" jc="between">
      <ArrowLeftIcon @click="$router.go(-1)" class="cursor-pointer" />
      <RouterLink to="/" class="text-sm">Edit wallt</RouterLink>
    </FlexBox>
    <FlexBox class="w-full py-6" d="col" :gap="2" ai="center" jc="center">
      <div>Current Account Asset</div>
      <div class="font-bold text-4xl">$ {{ totalBalance.toFixed(2) }} USD</div>
    </FlexBox>
    <Divider />
    <FlexBox class="w-full py-6"> </FlexBox>
  </FlexBox>
</template>

<style scoped lang="css"></style>
