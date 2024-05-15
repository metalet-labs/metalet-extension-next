<script lang="ts" setup>
import Decimal from 'decimal.js'
import { getBtcUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '@/lib/wallet'
import { ref, computed, watch, toRaw } from 'vue'
import { useBTCRateQuery } from '@/queries/transaction'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import { prettifyTxId, prettifyBalance } from '@/lib/formatters'
import { ChevronDoubleRightIcon, ChevronLeftIcon } from '@heroicons/vue/24/solid'

const isShowingDetails = ref(false)
const inputs = ref<{ address: string; value: number }[]>([])
const outputs = ref<{ address: string; value: number }[]>([])

const props = defineProps<{
  params: {
    toAddress: string
    satoshis: string
    options?: { noBroadcast: boolean; feeRate: string | number }
  }
}>()

console.log('BTCTransfer', props)

const { data: rateList } = useBTCRateQuery()

const currentFeeRate = computed(() => {
  if (props.params.options?.feeRate) {
    return Number(props.params.options.feeRate)
  }
  if (rateList.value) {
    const _rate = rateList.value.find((reteItem) => reteItem.title === 'Avg')
    if (_rate) {
      return Number(_rate.feeRate)
    }
  }
})

watch(
  currentFeeRate,
  async (_currentFeeRate) => {
    if (_currentFeeRate) {
      try {
        const wallet = await getCurrentWallet(Chain.BTC)
        const address = wallet.getAddress()
        const utxos = await getBtcUtxos(address, wallet.getScriptType() === ScriptType.P2PKH)
        const { txInputs, txOutputs } = wallet.send(
          props.params.toAddress,
          new Decimal(props.params.satoshis).div(1e8).toString(),
          _currentFeeRate,
          utxos
        )
        inputs.value = txInputs
        outputs.value = txOutputs
      } catch (err) {
        console.log(err)
      }
    }
  },
  { immediate: true }
)
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

      <div class="col-span-4 text-center">PSBT Details</div>
    </div>

    <!-- detail body -->
    <div class="py-4 grow">
      <div class="label mt-4">Fee Rate: {{ currentFeeRate }}</div>
      <div class="label mt-4">PSBT Structure</div>
      <div class="grid grid-cols-11 items-center mt-1">
        <div class="col-span-5 bg-sky-50 border-2 border-sky-300 border-dashed py-2 px-1 rounded-lg">
          <div class="text-center text-sm text-sky-900">Inputs</div>
          <div class="mt-2 space-2 text-xs flex flex-col gap-1">
            <div class="border-2 border-sky-300 bg-sky-300 rounded p-1" v-for="input in inputs">
              <div>Address</div>
              <div class="text-xs text-gray-500 break-all">
                {{ prettifyTxId(input.address, 4) }}
              </div>
              <div class="mt-2">Amount</div>
              <div class="text-xs text-gray-500 break">
                {{ prettifyBalance(input.value, 'BTC') }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-1 text-center mx-auto">
          <ChevronDoubleRightIcon class="h-4 w-4 text-gray-500" aria-hidden="true" />
        </div>

        <div class="col-span-5 bg-teal-50 border-2 border-teal-300 border-dashed py-2 px-1 rounded-lg">
          <div class="text-center text-sm text-teal-900">Outputs</div>
          <div class="mt-2 space-2 text-xs flex flex-col gap-1">
            <div class="border-2 border-teal-300 bg-teal-100 rounded p-1" v-for="output in outputs">
              <div>Address</div>
              <div class="text-xs text-gray-500 break-all">
                {{ prettifyTxId(output.address, 4) }}
              </div>
              <div class="mt-2">Amount</div>
              <div class="text-xs text-gray-500 break">
                {{ prettifyBalance(output.value, 'BTC') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <template v-else>
    <h3 class="text-base">BTC Transfer</h3>

    <!-- a button to view detail -->
    <div class="mt-2 flex items-center justify-center">
      <button
        class="underline decoration-primary-blue text-gray-700 px-4 py-2 mx-auto decoration underline-offset-4 hover:underline-offset-2 transition-all duration-300"
        @click="isShowingDetails = true"
      >
        View PSBT Details
      </button>
    </div>
  </template>
</template>
