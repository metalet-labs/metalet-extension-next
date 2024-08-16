<script lang="ts" setup>
import Decimal from 'decimal.js'
import { getTags } from '@/data/assets'
import { LoadingText } from '@/components'
import { computed, ref, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import CopyIcon from '@/components/Copy.vue'
import { useRoute, useRouter } from 'vue-router'
import AssetLogo from '@/components/AssetLogo.vue'
import Activities from './components/Activities.vue'
import { PencilIcon } from '@heroicons/vue/20/solid'
import { Chain } from '@metalet/utxo-wallet-service'
import FilterIcon from '@/assets/icons-v3/filter.svg'
import { useMRC20DetailQuery } from '@/queries/mrc20'
import { CoinCategory } from '@/queries/exchange-rates'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { calcBalance, truncateStr } from '@/lib/formatters'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const route = useRoute()
const router = useRouter()
const symbol = route.params.symbol as string
const mrc20Id = ref<string>(route.params.mrc20Id as string)
const address = computed(() => route.params.address as string)

const { data: asset } = useMRC20DetailQuery(address, mrc20Id, {
  enabled: computed(() => !!address.value && !!mrc20Id.value),
})

const balance = computed(() => {
  if (asset.value?.balance) {
    return asset.value.balance.total.toNumber()
  }
})

const tags = getTags(CoinCategory.MRC20)

const assetUSD = computed(() => {
  const usdRate = new Decimal(0)
  if (asset.value) {
    if (asset.value?.balance) {
      const balanceInStandardUnit = asset.value.balance.total.dividedBy(10 ** asset.value.decimal)
      return usdRate.mul(balanceInStandardUnit)
    }
  }
})

const logo = computed(() => asset.value?.icon || '')

watch(assetUSD, (_assetUSD) => {
  if (asset.value && _assetUSD) {
    updateAsset({ chain: asset.value.chain, name: asset.value.tokenName, value: _assetUSD.toNumber() })
  }
})

const toMint = () => {
  router.push(`/wallet/mintMRC20/${asset.value!.tokenName}/${mrc20Id.value}/${address.value}`)
}

const toSend = () => {
  router.push({
    name: 'SendMRC20',
    params: {
      mrc20Id: mrc20Id.value,
      address: address.value,
      name: asset.value!.tokenName,
    },
  })
}
</script>

<template>
  <div class="flex flex-col items-center space-y-6 w-full">
    <div class="flex flex-col items-center">
      <AssetLogo :logo="logo" :chain="Chain.BTC" :symbol="symbol" type="network" class="w-15" />

      <div v-if="asset?.balance && asset?.balance?.unconfirmed.toNumber()" class="text-gray-primary mt-2">
        +{{ calcBalance(asset.balance.unconfirmed.toNumber(), asset.decimal, asset.symbol) }}
      </div>

      <div class="mt-2 text-2xl text-balance max-w-full text-center">
        <span v-if="asset?.balance" class="break-all">
          <span>
            {{ calcBalance(asset.balance.confirmed.toNumber(), asset.decimal, '') }}
          </span>
          <!-- <span v-if="asset?.balance?.unconfirmed.toNumber()" class="text-gray-primary">
            +{{ calcBalance(asset.balance.unconfirmed.toNumber(), asset.decimal, asset.symbol) }}
          </span> -->
        </span>
        <span v-else>-- {{ symbol }}</span>
        <!-- <span class="text-gray-primary ml-2" v-if="assetUSD !== undefined">
          ≈ ${{ assetUSD?.toNumber().toFixed(2) }}
        </span> -->
      </div>

      <div class="text-gray-primary ml-2" v-if="assetUSD !== undefined">≈ ${{ assetUSD?.toNumber().toFixed(2) }}</div>

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
      <!-- TODO: mintable -->
      <!-- <button @click="toMint" :disabled="true" :class="['btn-blue-light', { 'opacity-50 cursor-not-allowed': true }]">
        <PencilIcon class="w-3" />
        <span>Mint</span>
      </button> -->
      <button
        @click="toSend"
        :disabled="!balance"
        :class="['btn-blue-light', { 'opacity-50 cursor-not-allowed': !balance }]"
      >
        <ArrowUpIcon class="w-3" />
        <span>Send</span>
      </button>
    </div>

    <div class="mt-8 flex flex-col items-center gap-y-2 w-full">
      <div class="flex items-center justify-between w-full">
        <div class="text-xs text-gray-500">Deployer</div>
        <div class="flex items-center gap-x-2">
          <AssetLogo :logo="asset?.deployAvatar" :symbol="asset?.deployName" class="size-5 shrink-0 rounded-full text-xs" />
          <span>{{ asset?.deployName || '--' }}</span>
        </div>
      </div>
      <div class="flex items-center justify-between w-full">
        <div class="text-xs text-gray-500">Token ID</div>
        <div class="flex items-center hover:text-blue-primary gap-x-2">
          <div class="text-base">{{ truncateStr(mrc20Id, 6) }}</div>
          <CopyIcon :text="mrc20Id" :title="'Token ID Copied'" />
        </div>
      </div>
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
      <Activities
        v-if="asset"
        :asset="asset"
        :exchangeRate="0"
        :icon="asset.icon"
        :address="address"
        :coinCategory="CoinCategory.MRC20"
      />
      <LoadingText text="Activities Loading..." v-else />
    </div>
  </div>
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
