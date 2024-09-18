<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Asset, BTCAsset } from '@/data/assets'
import { refDebounced } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { runeTokens } from '@/data/pinned-tokens'
import RunesTokenIcon from './RunesTokenIcon.vue'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { Chain } from '@metalet/utxo-wallet-service'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { useRunesPool } from '@/hooks/swap/useRunesPool'
import RunesSwapTokenButton from './RunesSwapTokenButton.vue'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useRuneDetailQuery, getRunesTokensQuery } from '@/queries/runes'
import { ChevronDownIcon, FrownIcon, Loader as LoaderCircleIcon, SearchIcon, XIcon } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { pairStr, token1, token2: runeId } = useRunesPool()
const isOpen = ref(false)

const { getAddress } = useChainWalletsStore()
const address = getAddress(Chain.BTC)

const { data: runeAsset } = useRuneDetailQuery(address, runeId, {
  enabled: computed(() => !!address.value && !!runeId.value),
})

defineProps<{
  btcAsset: Asset
}>()

const { getIcon } = useIconsStore()

const emit = defineEmits(['selectToken'])

function selectToken(token: string) {
  isOpen.value = false
  if (['swap-pools-add', 'swap-pools-remove'].includes(route.name as string)) {
    router.push(`/runes-pools/btc-${token}`)
  } else {
    router.replace(`/wallet/swap/btc/rune/btc-${token}`)
  }
}

const keyword = ref('')
const keywordDebounced = refDebounced(keyword, 300)
const inputKeyword = ref<HTMLInputElement | null>(null)

const { data: tokens, isLoading: isLoadingTokens } = getRunesTokensQuery(
  { keyword: keywordDebounced },
  computed(() => isOpen.value)
)
</script>

<template>
  <button
    v-bind="$attrs"
    v-if="runeAsset"
    @click="() => (isOpen = true)"
    class="flex items-center gap-1 rounded-full bg-gray-secondary px-3 py-1.5 text-sm font-semibold shadow-sm transition-all hover:bg-opacity-80 text-runes"
  >
    <div class="flex items-center" v-if="pairStr">
      <AssetLogo
        class="size-6 text-xs"
        :chain="btcAsset.chain"
        :symbol="btcAsset.symbol"
        :logo="getIcon(CoinCategory.Native, btcAsset.symbol)"
      />
      <RunesTokenIcon :symbol="runeAsset.symbol" class="size-6 rounded-full -ml-2" />
    </div>

    <div class="text-xs" v-if="pairStr">
      {{ btcAsset.tokenName + '-' + runeAsset.tokenName }}
    </div>
    <div v-else class="pl-2">Select token</div>

    <ChevronDownIcon class="h-4 w-4" />
  </button>

  <Dialog :open="isOpen" :initial-focus="inputKeyword">
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur" aria-hidden="true"></div>

    <div class="fixed inset-0 z-[60] flex w-screen items-center justify-center p-4">
      <DialogPanel
        class="z-[70] min-w-full rounded-xl bg-zinc-800 p-4 text-zinc-300 shadow-highlight lg:min-h-48 lg:min-w-[24rem]"
      >
        <div class="flex items-center justify-between pb-4">
          <span>Select a token</span>

          <button @click="() => (isOpen = false)">
            <XIcon class="h-6 w-6 duration-300 hover:rotate-90 hover:text-runes" />
          </button>
        </div>

        <!-- body -->
        <!-- searchbar -->
        <div class="relative flex items-center gap-4">
          <input
            type="text"
            class="flex-1 rounded-xl border-0 bg-zinc-950 p-2 text-zinc-300 focus:!ring-runes"
            placeholder="Enter rune name"
            ref="inputKeyword"
            v-model="keyword"
          />
          <SearchIcon class="absolute right-0 size-6 pr-2 text-zinc-500" />
        </div>

        <!-- pinned tokens -->
        <div class="mt-4">
          <h6 class="text-sm text-zinc-500">Popular Runes</h6>
          <div class="mt-2 flex flex-wrap gap-2">
            <RunesSwapTokenButton
              :symbol="token.symbol"
              :token="token.spacedRune"
              v-for="token in runeTokens"
              @click="selectToken(token.runeid)"
            />
          </div>
        </div>

        <!-- divider -->
        <div class="-mx-4 mt-4 border-b border-zinc-700 px-4"></div>

        <!-- token list -->
        <div class="mt-4">
          <div class="py-8" v-if="isLoadingTokens">
            <LoaderCircleIcon class="mx-auto size-6 animate-spin" />
          </div>

          <div class="py-8" v-else-if="tokens && !tokens.length">
            <FrownIcon class="mx-auto size-10 text-zinc-500" />
            <div class="mt-2 text-center text-zinc-500">No results.</div>
          </div>

          <div
            v-for="token in tokens"
            :key="token.runeid"
            class="group -mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-900"
            @click="selectToken(token.runeid)"
          >
            <RunesTokenIcon :symbol="token.symbol" class="size-8" />
            <h4 class="text-sm group-hover:text-runes">
              {{ token.spacedRune }}
            </h4>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
