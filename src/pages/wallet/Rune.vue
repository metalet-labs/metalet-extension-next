<script lang="ts" setup>
import Decimal from 'decimal.js'
import { getTags } from '@/data/assets'
import { LoadingText } from '@/components'
import { computed, ref, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import { calcBalance } from '@/lib/formatters'
import { useRoute, useRouter } from 'vue-router'
import AssetLogo from '@/components/AssetLogo.vue'
import Activities from './components/Activities.vue'
import { PencilIcon } from '@heroicons/vue/20/solid'
import { useRuneDetailQuery } from '@/queries/runes'
import FilterIcon from '@/assets/icons-v3/filter.svg'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const route = useRoute()
const router = useRouter()
const runeId = ref<string>(route.params.runeId as string)
const address = computed(() => route.params.address as string)

const { isLoading: isRuneDetailLoading, data: asset } = useRuneDetailQuery(address, runeId, {
  enabled: computed(() => !!address.value && !!runeId.value),
})

const tags = computed(() => {
  if (asset.value) {
    return getTags(asset.value)
  }
})

const assetUSD = computed(() => {
  const usdRate = new Decimal(0)
  if (asset.value) {
    if (asset.value?.balance) {
      const balanceInStandardUnit = new Decimal(asset.value.balance?.total || 0).dividedBy(10 ** asset.value.decimal)
      return usdRate.mul(balanceInStandardUnit)
    }
  }
})

watch(assetUSD, (_assetUSD) => {
  if (asset.value && _assetUSD) {
    updateAsset({ chain: asset.value.chain, name: asset.value.tokenName, value: _assetUSD.toNumber() })
  }
})

const toMint = () => {
  router.push(`/wallet/receive/${address.value}?chain=${asset.value!.chain}`)
}

const toSend = () => {
  router.push(`/wallet/sendRune/${asset.value!.tokenName}/${runeId.value}/${address.value}`)
}
</script>

<template>
  <LoadingText text="Rune Asset Loading..." v-if="isRuneDetailLoading" />
  <div class="flex flex-col items-center space-y-6 w-full" v-else-if="asset">
    <div class="flex flex-col items-center">
      <AssetLogo :logo="asset.logo" :chain="asset.chain" :symbol="asset.symbol" type="network" class="w-15" />

      <div class="mt-3 text-2xl">
        <span v-if="asset.balance">{{ calcBalance(asset.balance.total, asset.decimal, asset.symbol) }}</span>
        <span v-else>-- {{ asset.symbol }}</span>
        <span class="text-gray-primary ml-2" v-if="assetUSD !== undefined">
          ≈ ${{ assetUSD?.toNumber().toFixed(2) }}
        </span>
      </div>

      <div
        :key="tag.name"
        v-for="tag in tags"
        :style="`background-color:${tag.bg};color:${tag.color};`"
        :class="['px-1', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'mt-2']"
      >
        {{ tag.name }}
      </div>
    </div>

    <div class="flex items-center justify-center gap-x-2">
      <button @click="toMint" class="btn-blue-light">
        <PencilIcon class="w-3" />
        <span>Mint</span>
      </button>
      <button @click="toSend" class="btn-blue-light">
        <ArrowUpIcon class="w-3" />
        <span>Send</span>
      </button>
    </div>

    <div class="w-full">
      <div class="-mx-4 h-11 bg-gray-light px-4 py-[13px] text-ss" v-if="false">
        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center justify-between w-full">
            <div class="flex items-center gap-x-2">
              <span>Time</span>
              <SelectorIcon />
            </div>
            <FilterIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="bg-white">
            <DropdownMenuItem @select="null">Time</DropdownMenuItem>
            <DropdownMenuItem @select="null">Other</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Activities class="mt-8 self-stretch" :asset="asset" :exchangeRate="0" :address="address" />
    </div>
  </div>
  <LoadingText text="No Rune Asset Found." v-else />
</template>

<style scoped lang="css">
.btn {
  @apply w-[119px] h-12 rounded-3xl flex items-center justify-center gap-x-2;
}

.btn-blue-light {
  @apply btn bg-blue-light text-blue-primary;
}

.btn-blue-primary {
  @apply btn bg-blue-primary text-white;
}

div[role='tablist'] {
  @apply p-0 h-auto;
}

button[role='tab'] {
  @apply flex flex-col items-center px-0 py-4 rounded-none border-b-2 border-transparent;
}

button[role='tab'][aria-selected='true'] {
  @apply border-blue-primary;
}

div[role='tabpanel'] {
  @apply px-3 py-4 mt-0;
}
</style>
