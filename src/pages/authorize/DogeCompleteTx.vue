<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import actions from '@/data/authorize-actions'
import { estimate } from '@/lib/actions/doge/complete-tx'
import { prettifyTxId, prettifyBalance, calcBalance } from '@/lib/formatters'
import { CheckBadgeIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import LoadingIcon from '@/components/LoadingIcon.vue'

const action = actions.DogeCompleteTx

const props = defineProps<{
  params: {
    txHex: string
    feeRate: number
    options?: {
      noBroadcast?: boolean
      changeAddress?: string
    }
  }
}>()

const isLoading = ref(true)
const error = ref<string | null>(null)
const isShowingDetails = ref(false)

// Estimated transaction data
const outputs = ref<Array<{ address: string; satoshis: number }>>([])
const estimatedInputCount = ref(0)
const estimatedFee = ref(0)
const totalOutput = ref(0)
const totalInput = ref(0)
const changeAmount = ref(0)

// Formatted values
const formattedFee = computed(() => calcBalance(estimatedFee.value, 8, 'DOGE'))
const formattedTotalOutput = computed(() => calcBalance(totalOutput.value, 8, 'DOGE'))
const formattedTotalInput = computed(() => calcBalance(totalInput.value, 8, 'DOGE'))
const formattedChange = computed(() => calcBalance(changeAmount.value, 8, 'DOGE'))

// Format feeRate as DOGE/KB (1 DOGE = 100,000,000 satoshis)
const feeRateDisplay = computed(() => {
  const feeRate = props.params.feeRate
  const dogePerKB = feeRate / 1e8
  if (dogePerKB >= 0.001) {
    return `${dogePerKB.toFixed(4)} DOGE/KB`
  }
  // 如果太小则显示 sat/KB
  return `${feeRate.toLocaleString()} sat/KB`
})

onMounted(async () => {
  try {
    const result = await estimate({
      txHex: props.params.txHex,
      feeRate: props.params.feeRate,
    })

    outputs.value = result.outputs
    estimatedInputCount.value = result.estimatedInputCount
    estimatedFee.value = result.estimatedFee
    totalOutput.value = result.totalOutput
    totalInput.value = result.totalInput
    changeAmount.value = result.change
  } catch (e: any) {
    error.value = e.message || 'Failed to estimate transaction'
    console.error('Failed to estimate transaction:', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
    <LoadingIcon class="w-8 h-8 text-primary-blue" />
    <p class="mt-4 text-gray-500">Estimating transaction...</p>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="flex flex-col items-center justify-center py-8">
    <ExclamationTriangleIcon class="w-12 h-12 text-red-500" />
    <p class="mt-4 text-red-500 text-center">{{ error }}</p>
  </div>

  <!-- Detail view -->
  <div v-else-if="isShowingDetails" class="bg-white absolute inset-0 p-4 flex flex-col gap-y-4">
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
    <div class="grow overflow-y-auto -mx-4 px-4 pr-2 nicer-scrollbar">
      <div class="grid grid-cols-11 items-center mt-1 overflow-y-auto">
        <!-- Inputs Section -->
        <div class="col-span-5 bg-sky-50 border-2 border-sky-300 border-dashed py-2 px-1 rounded-lg">
          <div class="text-center text-sm text-sky-900">Inputs</div>
          <div class="mt-2 space-y-2 text-xs">
            <div class="border-2 border-sky-300 bg-sky-300 rounded p-2">
              <div class="text-gray-700">Auto-selected</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ estimatedInputCount }} UTXO(s)
              </div>
              <div class="mt-2 text-gray-700">Total Input</div>
              <div class="text-xs text-gray-500">
                {{ formattedTotalInput }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-1 text-center mx-auto">
          <ChevronDoubleRightIcon class="h-4 w-4 text-gray-500" aria-hidden="true" />
        </div>

        <!-- Outputs Section -->
        <div class="col-span-5 bg-teal-50 border-2 border-teal-300 border-dashed py-2 px-1 rounded-lg">
          <div class="text-center text-sm text-teal-900">Outputs</div>
          <div class="mt-2 space-y-2 text-xs">
            <!-- Original outputs -->
            <div
              v-for="(output, index) in outputs"
              :key="index"
              class="border-2 border-teal-300 bg-teal-100 rounded p-2 space-y-1"
            >
              <template v-if="output.address">
                <div class="text-gray-700">{{ $t('Common.Address') }}</div>
                <div class="text-xs text-gray-500 break-all">
                  {{ prettifyTxId(output.address, 4) }}
                </div>
              </template>
              <template v-else>
                <div class="text-gray-700">Script Output</div>
              </template>
              <div class="text-gray-700 mt-1">{{ $t('Common.Amount') }}</div>
              <div class="text-xs text-gray-500">
                {{ prettifyBalance(output.satoshis, 'DOGE') }}
              </div>
            </div>

            <!-- Change output -->
            <div v-if="changeAmount > 0" class="border-2 border-yellow-300 bg-yellow-100 rounded p-2 space-y-1">
              <div class="text-gray-700">Change (Auto)</div>
              <div class="text-xs text-gray-500">
                {{ formattedChange }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fee breakdown -->
      <div class="mt-4 p-3 bg-gray-50 rounded-lg">
        <div class="text-sm font-medium text-gray-700 mb-2">Fee Breakdown</div>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-500">Total Input:</span>
            <span>{{ formattedTotalInput }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Total Output:</span>
            <span>{{ formattedTotalOutput }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Change:</span>
            <span>{{ formattedChange }}</span>
          </div>
          <div class="flex justify-between font-medium border-t pt-1">
            <span class="text-gray-700">Miner Fee:</span>
            <span class="text-primary-blue">{{ formattedFee }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main view -->
  <template v-else>
    <h3 class="text-base">{{ action.title }}</h3>

    <ul class="mt-4 space-y-3">
      <li v-for="(desc, index) in action.description" :key="index" class="flex items-start gap-x-2">
        <CheckBadgeIcon class="h-6 w-6 text-primary-blue shrink-0" />
        <div class="text-sm text-gray-700">{{ desc }}</div>
      </li>
    </ul>

    <!-- Transaction Summary -->
    <div class="mt-6 space-y-3">
      <!-- Outputs -->
      <div class="bg-gray-50 rounded-lg p-3">
        <div class="text-sm font-medium text-gray-700 mb-2">Outputs ({{ outputs.length }})</div>
        <div class="space-y-2">
          <div v-for="(output, index) in outputs" :key="index" class="text-xs">
            <div class="flex justify-between items-center">
              <span class="text-gray-500 truncate max-w-[60%]" :title="output.address">
                {{ output.address ? prettifyTxId(output.address, 6) : 'Script' }}
              </span>
              <span class="font-medium">{{ prettifyBalance(output.satoshis, 'DOGE') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto Inputs -->
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Auto Inputs</span>
        <span class="text-sm">{{ estimatedInputCount }} UTXO(s)</span>
      </div>

      <!-- Change -->
      <div v-if="changeAmount > 0" class="flex items-center justify-between">
        <span class="text-gray-600">Change</span>
        <span class="text-sm">{{ formattedChange }}</span>
      </div>

      <!-- Fee Rate -->
      <div class="flex items-center justify-between">
        <span class="text-gray-600">{{ $t('Common.FeeRate') }}</span>
        <span class="text-sm">{{ feeRateDisplay }}</span>
      </div>

      <!-- Miner Fee -->
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Miner's Fee</span>
        <span class="text-sm font-medium text-primary-blue">{{ formattedFee }}</span>
      </div>
    </div>

    <!-- View Details Button -->
    <div class="mt-4 flex items-center justify-center">
      <button
        class="underline decoration-primary-blue text-gray-700 px-4 py-2 mx-auto decoration underline-offset-4 hover:underline-offset-2 transition-all duration-300"
        @click="isShowingDetails = true"
      >
        View Transaction Details
      </button>
    </div>
  </template>
</template>
