<script setup lang="ts">
import { toTx } from '@/lib/helpers'
import { network } from '@/lib/network'
import { AssetLogo } from '@/components'
import { Asset, RuneAsset } from '@/data/assets'
import { computedEager } from '@vueuse/core'
import { toast } from '@/components/ui/toast'
import { calcBalance } from '@/lib/formatters'
import { computed, ref, watchEffect } from 'vue'
import RunesTokenIcon from './RunesTokenIcon.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { Chain } from '@metalet/utxo-wallet-service'
import { CoinCategory } from '@/queries/exchange-rates'
import { useOngoingTaskQuery } from '@/queries/brc20/swap'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useOngoingTask } from '@/hooks/swap/use-runes-ongoing-task'
import { FrownIcon, CheckIcon, XIcon, PlusIcon, Loader2Icon, TimerResetIcon, ArrowDownIcon } from 'lucide-vue-next'
import { getBrowserHost } from '@/lib/host'

defineProps<{
  asset: Asset
}>()

const { getIcon } = useIconsStore()
const { getAddress } = useChainWalletsStore()

const taskStatus = ref('waiting')
const address = getAddress(Chain.BTC)
const { buildId, clearOngoing } = useOngoingTask()
const { data: task } = useOngoingTaskQuery(
  address,
  network,
  buildId,
  computed(
    () => !!buildId.value && !!address.value && !!network.value && ['waiting', 'built'].includes(taskStatus.value)
  )
)

watchEffect(() => {
  if (task.value) {
    taskStatus.value = task.value.status
  } else if (buildId.value) {
    taskStatus.value = 'waiting'
  }
})

const extendedTask = computedEager(() => {
  if (!task.value) {
    return null
  }

  switch (task.value.type) {
    case '1x':
    case 'x2':
      return {
        type: 'swapToRune',
        typeDisplay: 'Swap',
        fromToken: task.value.token1,
        toToken: task.value.token2,
        fromAmount: task.value.amount1,
        toAmount: task.value.amount2,
      }
    case '2x':
    case 'x1':
      return {
        type: 'swapToBtc',
        typeDisplay: 'Swap',
        fromToken: task.value.token2,
        toToken: task.value.token1,
        fromAmount: task.value.amount2,
        toAmount: task.value.amount1,
      }
    case 'add':
      return {
        type: 'add',
        typeDisplay: 'Add Liquidity',
        fromToken: task.value.token1,
        toToken: task.value.token2,
        fromAmount: task.value.amount1,
        toAmount: task.value.amount2,
      }

    case 'remove':
      return {
        type: 'remove',
        typeDisplay: 'Remove Liquidity',
        fromToken: task.value.token1,
        toToken: task.value.token2,
        fromAmount: task.value.amount1,
        toAmount: task.value.amount2,
      }
    default:
      return null
  }
})

async function toExplorer() {
  if (!task.value) return
  if (!task.value.txid) return
  const host = await getBrowserHost(Chain.BTC)
  toTx(task.value.txid, host)
}

function closeModal() {
  clearOngoing()
}

function copyFailedReason() {
  if (!task.value?.failedReason) return
  navigator.clipboard.writeText(task.value.failedReason)
  toast({ toastType: 'success', title: 'Error message copied to clipboard' })
}
</script>

<template>
  <div
    v-show="buildId"
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-black/40 px-8 backdrop-blur"
  >
    <div class="w-80 xs:w-96 max-w-md rounded-xl bg-zinc-800 px-4 py-6 text-zinc-300 lg:px-8">
      <div class="flex items-center justify-between">
        <h3>Ongoing Task</h3>
        <button @click="closeModal" class="text-zinc-300">
          <XIcon class="size-6 text-zinc-300 hover:text-zinc-500" />
        </button>
      </div>

      <!-- body -->
      <div class="mt-8 flex flex-col items-center justify-center gap-8">
        <template v-if="['waiting', 'built'].includes(taskStatus)">
          <Loader2Icon class="size-20 xs:size-24 animate-spin text-zinc-500" />
          <p class="text-sm xs:text-lg capitalize">Running...</p>
        </template>

        <template v-else-if="taskStatus === 'completed'">
          <CheckIcon class="size-20 xs:size-24 rounded-full bg-green-500 p-2 text-zinc-800" :stroke-width="3" />

          <div class="flex items-center justify-between self-stretch">
            <p class="mr-auto text-sm xs:text-lg capitalize">Success!</p>

            <button @click="toExplorer" class="text-xs xs:text-sm text-runes hover:underline">View on Explorer</button>
          </div>
        </template>

        <template v-else-if="taskStatus === 'failed'">
          <FrownIcon class="size-20 xs:size-24 text-red-primary" />
          <div class="self-stretch">
            <p class="text-center text-sm xs:text-lg capitalize">Failed</p>
            <div
              class="group mt-2 cursor-pointer rounded-lg bg-zinc-900 p-2 text-sm"
              v-if="task?.failedReason"
              @click="copyFailedReason"
            >
              <h5 class="text-zinc-500">Error Message:</h5>
              <p class="-m-1 mt-1 text-wrap break-all rounded p-1 group-hover:bg-runes/10 group-hover:text-white">
                {{ task.failedReason }}
              </p>
            </div>
          </div>
        </template>

        <template v-else-if="taskStatus === 'timeout'">
          <TimerResetIcon class="size-20 xs:size-24 text-red-500" />
          <div class="self-stretch">
            <p class="text-center text-sm xs:text-lg capitalize">Timeout</p>

            <p class="mt-4 text-center text-zinc-500">Your transaction has timed out. Please try again later.</p>
          </div>
        </template>
      </div>

      <div class="mt-4 rounded-3xl border border-zinc-700 p-2">
        <div class="my-2 flex items-center justify-center gap-2">
          <h5
            class="bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-sm xs:text-lg font-bold leading-none text-transparent"
          >
            {{ extendedTask?.typeDisplay }}
          </h5>
        </div>

        <div class="rounded-2xl bg-black px-4 py-2" v-if="extendedTask">
          <div class="flex flex-col items-center gap-2 text-sm" v-if="extendedTask.type === 'swapToRune'">
            <div class="flex items-center gap-2">
              <AssetLogo
                class="size-6 text-xs"
                :symbol="extendedTask.fromToken"
                :logo="getIcon(CoinCategory.Native, extendedTask.fromToken.toLocaleUpperCase())"
              />
              <span>
                {{ calcBalance(extendedTask.fromAmount, 8, extendedTask.fromToken.toLocaleUpperCase()) }}
              </span>
            </div>

            <ArrowDownIcon class="mx-2 size-4" />

            <div class="flex items-center gap-2">
              <AssetLogo
                class="size-6 text-xs"
                :symbol="asset.symbol"
                :logo="getIcon(CoinCategory.BRC20, asset.symbol.toLocaleLowerCase())"
              />
              <span>
                {{ calcBalance(extendedTask.toAmount, asset.decimal, asset.symbol) }}
              </span>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2 text-sm" v-if="extendedTask.type === 'swapToBtc'">
            <div class="flex items-center gap-2">
              <RunesTokenIcon :symbol="asset.symbol" class="size-6 rounded-full" v-if="extendedTask.fromToken" />
              <span>
                {{ calcBalance(extendedTask.fromAmount, asset.decimal, asset.symbol) }}
              </span>
            </div>

            <ArrowDownIcon class="mx-2 size-4" />

            <div class="flex items-center gap-2">
              <AssetLogo
                class="size-6 text-xs"
                :symbol="extendedTask.toToken"
                :logo="getIcon(CoinCategory.Native, extendedTask.toToken.toLocaleUpperCase())"
              />
              <span>
                {{ calcBalance(extendedTask.toAmount, 8, extendedTask.toToken) }}
              </span>
            </div>
          </div>

          <div class="" v-else-if="extendedTask.type === 'add'">
            <div class="flex flex-col items-center gap-2 text-sm">
              <div class="flex items-center gap-2">
                <AssetLogo
                  class="size-6 text-xs"
                  :symbol="extendedTask.fromToken"
                  :logo="getIcon(CoinCategory.Native, extendedTask.fromToken.toLocaleUpperCase())"
                />
                <span>
                  {{ calcBalance(extendedTask.fromAmount, 8, extendedTask.fromToken) }}
                </span>
              </div>

              <PlusIcon class="mx-2 size-4" />
              <div class="flex items-center gap-2">
                <RunesTokenIcon :symbol="asset.symbol" class="size-6 rounded-full" />
                <span>
                  {{ calcBalance(extendedTask.toAmount, asset.decimal, asset.symbol) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2 text-sm" v-else-if="extendedTask.type === 'remove'">
            <div class="flex items-center gap-2">
              <AssetLogo
                class="size-6 text-xs"
                :symbol="extendedTask.fromToken"
                :logo="getIcon(CoinCategory.Native, extendedTask.fromToken.toLocaleUpperCase())"
              />
              <span>
                {{ calcBalance(extendedTask.fromAmount, 8, extendedTask.fromToken) }}
              </span>
            </div>

            <PlusIcon class="mx-2 size-4" />

            <div class="flex items-center gap-2">
              <RunesTokenIcon :symbol="asset.symbol" class="size-6 rounded-full" />

              <span>
                {{ calcBalance(extendedTask.toAmount, asset.decimal, asset.symbol) }}
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-full bg-black px-4 py-2 text-center" v-else>...</div>
      </div>
    </div>
  </div>
</template>
