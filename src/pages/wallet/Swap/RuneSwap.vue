<script lang="ts" setup>
import { computed, ref, toRaw } from 'vue'
import { BTCAsset } from '@/data/assets'
import { computedEager } from '@vueuse/core'
import SwapIcon from '@/assets/icons-v3/swap.svg'
import { SymbolTicker } from '@/lib/asset-symbol'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { useBalanceQuery } from '@/queries/balance'
import { useRuneDetailQuery } from '@/queries/runes'
import { Chain } from '@metalet/utxo-wallet-service'
import { useSwapPool } from '@/hooks/swap/useSwapPool'
import { CoinCategory } from '@/queries/exchange-rates'
import { calcBalance, truncateStr } from '@/lib/formatters'
import RunesSwapSideWithInput from './RunesSwapSideWithInput.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'

const { token1, token2: runeId } = useSwapPool()
const { getAddress } = useChainWalletsStore()

const address = getAddress(Chain.BTC)

const symbol = ref(BTCAsset.symbol)

const token1Amount = ref<string>()
const token2Amount = ref<string>()

const { getIcon } = useIconsStore()
const icon = computed(() => getIcon(CoinCategory.Native, token1.value as SymbolTicker) || '')

const balanceEnabled = computed(() => {
  return !!address.value && !!symbol.value
})

const { data: balance } = useBalanceQuery(address, symbol, { enabled: balanceEnabled })

const btcAsset = computed(() => {
  if (balance.value) {
    return { ...BTCAsset, balance: toRaw(balance.value) }
  }
  return BTCAsset
})

const { data: runeAsset } = useRuneDetailQuery(address, runeId, {
  enabled: computed(() => !!address.value && !!runeId.value),
})
</script>

<template>
  <div class="flex flex-col items-center gap-y-4">
    <RunesSwapSideWithInput
      side="pay"
      class="w-full"
      v-if="btcAsset"
      :asset="btcAsset"
      v-model:amount="token1Amount"
      :coinCategory="CoinCategory.Native"
    />

    <SwapIcon class="w-4.5 rotate-90 hover:text-blue-primary cursor-pointer" />

    <RunesSwapSideWithInput
      side="receive"
      class="w-full"
      v-if="runeAsset"
      :asset="runeAsset"
      v-model:amount="token2Amount"
      :coinCategory="CoinCategory.Rune"
    />
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
