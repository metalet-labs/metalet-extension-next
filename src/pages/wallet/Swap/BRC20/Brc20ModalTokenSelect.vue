<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Asset } from '@/data/assets'
import { useRouter } from 'vue-router'
import TokenIcon from './TokenIcon.vue'
import { AssetLogo } from '@/components'
import { refDebounced } from '@vueuse/core'
import { useIconsStore } from '@/stores/IconsStore'
import useBRC20Pool from '@/hooks/swap/useBRC20Pool'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { useBRC20TokensQuery } from '@/queries/brc20/index'
import { ChevronDownIcon, FrownIcon, Loader as LoaderCircleIcon, SearchIcon, XIcon } from 'lucide-vue-next'

const { pairStr, token1, token2 } = useBRC20Pool()

const router = useRouter()
const isOpen = ref(false)

const props = defineProps<{
  btcAsset: Asset
  pinnedTokens: string[]
  useCase?: 'swap' | 'swap-pools' | 'orderbook'
}>()
const emit = defineEmits(['selectToken'])

async function selectToken(token: string) {
  isOpen.value = false

  switch (props.useCase) {
    case 'swap':
      router.push(`/swap/brc20/btc-${token}`)
      break
    case 'swap-pools':
      router.push(`/swap-pools/brc20/btc-${token}`)
      break
    case 'orderbook':
      router.push(`/orderbook/brc20/btc-${token}`)
      break
    default:
      router.replace(`/wallet/swap/btc/brc20/btc-${token}`)
      break
  }
}

const { getIcon } = useIconsStore()

const keyword = ref('')
const keywordDebounced = refDebounced(keyword, 300)
const inputKeyword = ref<HTMLInputElement | null>(null)

const { data: tokens, isLoading: isLoadingTokens } = useBRC20TokensQuery(
  { keyword: keywordDebounced },
  computed(() => isOpen.value)
)
</script>

<template>
  <button
    class="flex items-center gap-1 rounded-full bg-gray-secondary px-3 py-1.5 text-sm font-semibold shadow-sm transition-all hover:bg-opacity-80 text-brc20"
    @click="isOpen = true"
    v-bind="$attrs"
  >
    <div class="flex" v-if="pairStr">
      <AssetLogo
        class="size-6 text-xs"
        :chain="btcAsset.chain"
        :symbol="btcAsset.symbol"
        :logo="getIcon(CoinCategory.Native, btcAsset.symbol)"
      />
      <AssetLogo
        bg-color="bg-brc20"
        class="size-6 text-xs -ml-2"
        :chain="btcAsset.chain"
        :symbol="token2.toLocaleUpperCase()"
        :logo="getIcon(CoinCategory.BRC20, btcAsset.symbol.toLocaleLowerCase())"
      />
    </div>
    <div class="mr-1" v-if="pairStr">
      {{ token1.toLocaleUpperCase() + '-' + token2.toLocaleUpperCase() }}
    </div>
    <div v-else class="pl-2 text-base text-primary">Select token</div>
    <ChevronDownIcon class="h-5 w-5" />
  </button>

  <Dialog :open="isOpen" :close="() => (isOpen = false)" :initial-focus="inputKeyword">
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur" aria-hidden="true"></div>

    <div class="fixed inset-0 z-[60] flex w-screen items-center justify-center p-4">
      <DialogPanel
        class="z-[70] min-w-full rounded-xl bg-zinc-800 p-4 text-zinc-300 shadow-highlight lg:min-h-48 lg:min-w-[24rem]"
      >
        <div class="flex items-center justify-between pb-4">
          <span>Select a token</span>

          <button @click="isOpen = false">
            <XIcon class="h-6 w-6 duration-300 hover:rotate-90 hover:text-primary" />
          </button>
        </div>

        <!-- body -->
        <!-- searchbar -->
        <div class="relative flex items-center gap-4">
          <input
            type="text"
            class="flex-1 rounded-xl border-0 bg-zinc-950 p-2 text-zinc-300"
            placeholder="Enter BRC-20 token name"
            ref="inputKeyword"
            v-model="keyword"
          />
          <SearchIcon class="absolute right-0 size-6 pr-2 text-zinc-500" />
        </div>

        <!-- pinned tokens -->
        <div class="mt-4">
          <h6 class="text-sm text-zinc-500">Popular BRC-20s</h6>
          <div class="mt-2 flex flex-wrap gap-2">
            <SwapTokenButton
              v-for="token in props.pinnedTokens"
              :token="token"
              @click="selectToken(token)"
            ></SwapTokenButton>
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
            :key="token.ticker"
            class="group -mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-900"
            @click="selectToken(token.ticker)"
          >
            <TokenIcon :token="token.ticker" class="size-8" />
            <h4 class="text-sm group-hover:text-primary">
              {{ token.ticker }}
            </h4>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
