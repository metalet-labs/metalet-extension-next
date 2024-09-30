<script setup lang="ts">
import { AssetLogo } from '@/components'
import { CoinCategory } from '@/queries/exchange-rates'
import { useIconsStore } from '@/stores/IconsStore'
import { Chain } from '@metalet/utxo-wallet-service'

defineProps<{
  token: string
}>()

const { getIcon } = useIconsStore()
</script>

<template>
  <button
    class="flex items-center gap-1 rounded-full border-2 border-zinc-700 bg-zinc-800 p-1.5 pr-3 text-zinc-300 hover:border-primary hover:bg-zinc-900 hover:text-primary"
  >
    <AssetLogo
      bg-color="bg-brc20"
      class="size-6 text-xs"
      :chain="Chain.BTC"
      :symbol="token.toLocaleUpperCase()"
      :logo="getIcon(CoinCategory.BRC20, token.toLocaleLowerCase())"
    />
    <span>{{ token }}</span>
  </button>
</template>
