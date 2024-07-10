<script lang="ts" setup>
import { computed } from 'vue'
import SwapIcon from '@/assets/icons-v3/swap.svg'
import { SymbolTicker } from '@/lib/asset-symbol'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { useRuneDetailQuery } from '@/queries/runes'
import { Chain } from '@metalet/utxo-wallet-service'
import { useSwapPool } from '@/hooks/swap/useSwapPool'
import { CoinCategory } from '@/queries/exchange-rates'
import { calcBalance, truncateStr } from '@/lib/formatters'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const { token1, token2: runeId } = useSwapPool()
const { getAddress } = useChainWalletsStore()

const address = getAddress(Chain.BTC)

const { getIcon } = useIconsStore()
const icon = computed(() => getIcon(CoinCategory.Native, token1.value as SymbolTicker) || '')

const { data: asset } = useRuneDetailQuery(address, runeId, {
  enabled: computed(() => !!address.value && !!runeId.value),
})
</script>

<template>
  <div class="flex flex-col items-center gap-y-4">
    <div class="space-y-1.5 w-full">
      <div class="flex items-end justify-between">
        <span class="text-sm">You Pay</span>
        <span class="text-xs">
          <span class="text-gray-primary">Balance:</span>
          <span class="text-blue-primary">24.000</span>
        </span>
      </div>
      <div class="border border-gray-soft rounded-lg p-3 flex items-center gap-x-1">
        <AssetLogo :logo="icon" :chain="Chain.BTC" :symbol="token1" class="w-[38px] text-lg" />
        <span>{{ token1 }}</span>
      </div>
    </div>
    <SwapIcon class="w-4.5 rotate-90 hover:text-blue-primary cursor-pointer" />
    <div class="space-y-1.5 w-full" v-if="asset">
      <div class="flex items-end justify-between">
        <span class="text-sm">You Receive</span>
        <span class="text-xs">
          <span class="text-gray-primary">Balance:</span>
          <span class="text-blue-primary">
            {{ calcBalance(asset.balance!.total.toNumber(), asset.decimal, asset.symbol) }}
          </span>
        </span>
      </div>
      <div class="border border-gray-soft rounded-lg p-3 flex items-center gap-x-1">
        <AssetLogo :logo="undefined" :chain="Chain.BTC" :symbol="asset.symbol" class="w-[38px] text-lg" />
        <span :title="asset.tokenName">{{ truncateStr(asset.tokenName) }}</span>
        <!-- <RunesSwapSideWithInput
        side="pay"
        v-if="true"
        v-model:symbol="asset.symbol"
        v-model:rune="asset"
        v-model:amount="asset.balance!.total"
      /> -->
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
