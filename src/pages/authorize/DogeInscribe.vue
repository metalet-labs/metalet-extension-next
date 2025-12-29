<script lang="ts" setup>
import Decimal from 'decimal.js'
import { ref, computed } from 'vue'
import Copy from '@/components/Copy.vue'
import actions from '@/data/authorize-actions'
import { getDogeWallet } from '@/lib/actions/doge/wallet'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { MetaidData } from '@/lib/actions/doge/inscribe'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { fetchDogeBalance } from '@/queries/doge/balance'
import { DogeBalanceResult } from '@/queries/doge/types'

const action = actions.DogeInscribe

const props = defineProps<{
  params: {
    data: {
      feeRate: number
      metaidDataList: MetaidData[]
      service?: {
        address: string
        satoshis: string
      }
    }
    message: string
  }
}>()

const address = ref('')
const loading = ref(true)
const error = ref<Error>()
const commitCost = ref<number>(0)
const revealCost = ref<number>(0)
const totalCost = ref<number>(0)
const commitTxHex = ref<string>()
const revealTxsHex = ref<string[]>([])
const balanceData = ref<DogeBalanceResult | null>(null)

const metaidDataList = props.params.data.metaidDataList
const dappCost = Number(props.params.data.service?.satoshis) || 0

// 格式化 feeRate 显示：转换为 DOGE/KB 格式
const formatFeeRate = computed(() => {
  const feeRate = props.params.data.feeRate
  // 1 DOGE = 100,000,000 satoshis
  const dogePerKB = feeRate / 1e8
  if (dogePerKB >= 0.001) {
    return `${dogePerKB.toFixed(4)} DOGE/KB`
  }
  // 如果太小则显示 sat/KB
  return `${(feeRate / 1000).toFixed(0)} sat/vB`
})

metaidDataList.sort((a: MetaidData, b: MetaidData) => {
  if (a.contentType?.includes('image') && !b.contentType?.includes('image')) {
    return -1
  } else if (!a.contentType?.includes('image') && b.contentType?.includes('image')) {
    return 1
  } else {
    return 0
  }
})

const categorizedMetaidDataList: { [key: string]: MetaidData[] } = metaidDataList.reduce(
  (acc: { [key: string]: MetaidData[] }, curr: MetaidData) => {
    const { operation } = curr
    if (!acc[operation]) {
      acc[operation] = []
    }
    acc[operation].push(curr)
    return acc
  },
  {} as { [key: string]: MetaidData[] }
)

// 获取 DOGE 钱包地址
getDogeWallet().then((wallet) => {
  address.value = wallet.getAddress()
  // 获取余额
  fetchDogeBalance(address.value).then((balance) => {
    balanceData.value = balance
  })
})

const isShowingDetails = ref(false)

// 预处理交易（不广播）
actions.DogeInscribe.process({ ...props.params, options: { noBroadcast: true } })
  .then(
    ({
      commitTxHex: _commitTxHex,
      revealTxsHex: _revealTxsHex,
      commitCost: _commitCost,
      revealCost: _revealCost,
      totalCost: _totalCost,
    }: {
      commitTxHex: string
      revealTxsHex: string[]
      commitCost: number
      revealCost: number
      totalCost: number
    }) => {
      commitCost.value = _commitCost
      revealCost.value = _revealCost
      commitTxHex.value = _commitTxHex
      revealTxsHex.value = _revealTxsHex
      totalCost.value = _totalCost
    }
  )
  .catch((err: Error) => {
    error.value = err
  })
  .finally(() => {
    loading.value = false
  })
</script>

<template>
  <div class="bg-white absolute inset-0 p-4 flex flex-col" v-if="isShowingDetails">
    <!-- detail header -->
    <div class="grid grid-cols-6 items-center">
      <div class="col-span-1">
        <button class="rounded-full shadow-md p-2" @click="isShowingDetails = false">
          <ChevronLeftIcon class="h-4 w-4 text-gray-500" aria-hidden="true" />
        </button>
      </div>

      <div class="col-span-4 text-center">Transaction Details</div>
    </div>

    <!-- detail body -->
    <div class="py-4 space-y-2">
      <div class="flex justify-between">
        <div class="label">Commit Cost</div>
        <div class="text-xs flex gap-2">{{ commitCost / 1e8 }} DOGE</div>
      </div>
      <div class="flex justify-between">
        <div class="label">Reveal Cost</div>
        <div class="text-xs flex gap-2">{{ revealCost / 1e8 }} DOGE</div>
      </div>
      <div class="flex justify-between">
        <div class="label">Dapps Cost</div>
        <div class="text-xs flex gap-2">{{ dappCost / 1e8 }} DOGE</div>
      </div>
      <div class="flex justify-between">
        <div class="label">Total Cost</div>
        <div class="text-xs flex gap-2">{{ totalCost / 1e8 }} DOGE</div>
      </div>
      <div class="flex justify-between">
        <div class="label">{{ $t('Common.FeeRate') }}</div>
        <div class="text-xs flex gap-2">{{ formatFeeRate }}</div>
      </div>
      <div class="flex justify-between text-gray-500">
        <div class="label">CommitTx Hex</div>
        <Copy :text="commitTxHex || ''" />
      </div>
      <div class="flex justify-between text-gray-500" v-for="(txHex, i) in revealTxsHex" :key="i">
        <div class="label">{{ `RevealTx${i + 1} Hex` }}</div>
        <Copy :text="txHex" />
      </div>
    </div>
  </div>

  <div class="space-y-4" v-else>
    <h3 class="text-base">{{ action.title }}</h3>
    <div class="value">{{ params.message }}</div>

    <div v-if="loading" class="flex items-center justify-center gap-x-2">
      <LoadingIcon class="!text-gray-primary" />
      <span>Data Loading...</span>
    </div>
    <div v-else-if="error" class="w-full flex flex-col gap-4">
      <p class="text-red-500 text-xs">{{ error.message }}</p>
      <div class="flex justify-between">
        <div class="label">You have:</div>
      </div>
      <div class="flex justify-between">
        <div class="label">Pending</div>
        <div class="text-xs flex gap-2">{{ balanceData?.unconfirmed?.div(1e8).toFixed(8) || '0' }} DOGE</div>
      </div>
      <div class="flex justify-between">
        <div class="label">Available</div>
        <div class="text-xs flex gap-2">{{ balanceData?.confirmed?.div(1e8).toFixed(8) || '0' }} DOGE</div>
      </div>
    </div>
    <div v-else class="mt-2 flex flex-col items-center justify-center gap-y-2">
      <div class="flex flex-col w-full gap-y-2">
        <div class="flex justify-between">
          <div class="label">Total Cost</div>
          <div class="text-xs flex gap-2">{{ totalCost / 1e8 }} DOGE</div>
        </div>
        <div class="flex justify-between">
          <div class="label">{{ $t('Common.FeeRate') }}</div>
          <div class="text-xs flex gap-2">{{ formatFeeRate }}</div>
        </div>
      </div>
      <button
        class="underline decoration-primary-blue text-gray-700 px-4 py-2 mx-auto decoration underline-offset-4 hover:underline-offset-2 transition-all duration-300"
        @click="isShowingDetails = true"
      >
        View Transaction Details
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-2" v-for="(categorizedMetaidData, opKey) in categorizedMetaidDataList" :key="opKey">
        <div>operation: {{ categorizedMetaidData[0].operation }}</div>
        <div class="grid grid-cols-3 gap-4 justify-items-center">
          <template v-for="(metaidData, idx) in categorizedMetaidData" :key="idx">
            <template v-if="metaidData.body">
              <img
                alt=""
                class="w-full aspect-square object-cover"
                v-if="metaidData.contentType?.includes('image')"
                :src="`data:image/jpeg;base64,${metaidData.body}`"
              />

              <div v-else class="col-span-3 text-sm break-all w-full">{{ metaidData.body }}</div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
