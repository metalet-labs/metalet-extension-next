<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Copy from '@/components/Copy.vue'
import actions from '@/data/authorize-actions'
import { getDogeWallet } from '@/lib/actions/doge/wallet'
import { Psbt, PsbtTxOutput } from 'bitcoinjs-lib'
import { getNetwork } from '@/lib/network'
import { getDogeNetwork } from '@/lib/doge/network'
import { prettifyTxId, prettifyBalance, prettifyBalanceFixed, calcBalance } from '@/lib/formatters'
import { CheckBadgeIcon, ChevronDoubleRightIcon, ChevronLeftIcon } from '@heroicons/vue/24/solid'

type PsbtInput = (typeof Psbt.prototype.data.inputs)[0]

const TX_EMPTY_SIZE = 4 + 1 + 1 + 4 // 10
const TX_INPUT_BASE = 32 + 4 + 1 + 4 // 41
const TX_INPUT_PUBKEY_HASH = 107
const TX_OUTPUT_BASE = 8 + 1
const TX_OUTPUT_PUBKEY_HASH = 25
const TX_OUTPUT_SCRIPT_HASH = 23

function transactionBytes(inputs: PsbtInput[], outputs: PsbtTxOutput[]) {
  const inputsSize = inputs.reduce(function (a, x) {
    return a + inputBytes(x)
  }, 0)
  const outputsSize = outputs.reduce(function (a, x) {
    return a + outputBytes(x)
  }, 0)

  return TX_EMPTY_SIZE + inputsSize + outputsSize
}

function inputBytes(input: PsbtInput) {
  return TX_INPUT_BASE + (input.redeemScript ? input.redeemScript.length : TX_INPUT_PUBKEY_HASH)
}

function outputBytes(output: PsbtTxOutput) {
  return (
    TX_OUTPUT_BASE +
    (output.script
      ? output.script.length
      : output.address?.startsWith('9') || output.address?.startsWith('A')
        ? TX_OUTPUT_SCRIPT_HASH
        : TX_OUTPUT_PUBKEY_HASH)
  )
}

function calcSize(psbt: Psbt) {
  const inputs = psbt.data.inputs
  const outputs = psbt.txOutputs
  return transactionBytes(inputs, outputs)
}

const action = actions.SignDOGEPsbt

const props = defineProps<{
  params: {
    psbtHex: string
    options: any
  }
}>()

const fee = ref()
const feeRate = ref()
const isShowingDetails = ref(false)

const psbtHex = props.params.psbtHex
const inputs = ref<
  {
    address: string
    value: number
  }[]
>([])
const outputs = ref<{ address: string; value: number; script: string }[]>([])

onMounted(async () => {
  try {
    const network = await getNetwork()
    const psbtNetwork = getDogeNetwork(network)
    const psbt = Psbt.fromHex(psbtHex, { network: psbtNetwork })
    
    // Parse inputs
    const parsedInputs: { address: string; value: number }[] = []
    psbt.data.inputs.forEach((input, index) => {
      let value = 0
      let address = ''
      if (input.witnessUtxo) {
        value = input.witnessUtxo.value
        try {
          const { address: fromOutputScript } = require('bitcoinjs-lib')
          address = fromOutputScript.fromOutputScript(input.witnessUtxo.script, psbtNetwork)
        } catch (e) {
          address = 'Unknown'
        }
      } else if (input.nonWitnessUtxo) {
        const { Transaction } = require('bitcoinjs-lib')
        const tx = Transaction.fromBuffer(input.nonWitnessUtxo)
        const output = tx.outs[psbt.txInputs[index].index]
        value = output.value
        try {
          const { address: fromOutputScript } = require('bitcoinjs-lib')
          address = fromOutputScript.fromOutputScript(output.script, psbtNetwork)
        } catch (e) {
          address = 'Unknown'
        }
      }
      parsedInputs.push({ address, value })
    })
    inputs.value = parsedInputs

    // Parse outputs
    const parsedOutputs: { address: string; value: number; script: string }[] = []
    psbt.txOutputs.forEach((output) => {
      parsedOutputs.push({
        address: output.address || '',
        value: output.value,
        script: output.script?.toString('hex') || '',
      })
    })
    outputs.value = parsedOutputs

    // Calculate fee
    const totalInput = parsedInputs.reduce((sum, input) => sum + input.value, 0)
    const totalOutput = parsedOutputs.reduce((sum, output) => sum + output.value, 0)
    fee.value = totalInput - totalOutput
    feeRate.value = fee.value / calcSize(psbt)
  } catch (e) {
    console.error('Failed to parse PSBT:', e)
  }
})
</script>

<template>
  <div class="bg-white absolute inset-0 p-4 flex flex-col gap-y-4" v-if="isShowingDetails">
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
    <div class="grow overflow-y-auto -mx-4 px-4 pr-2 nicer-scrollbar">
      <div class="grid grid-cols-11 items-center mt-1 overflow-y-auto">
        <div class="col-span-5 bg-sky-50 border-2 border-sky-300 border-dashed py-2 px-1 rounded-lg">
          <div class="text-center text-sm text-sky-900">Inputs</div>
          <div class="mt-2 space-y-2 text-xs">
            <div class="border-2 border-sky-300 bg-sky-300 rounded p-1 space-y-2" v-for="input in inputs">
              <div>{{ $t('Common.Address') }}</div>
              <div class="text-xs text-gray-500 break-all">
                {{ prettifyTxId(input.address, 4) }}
              </div>
              <div class="mt-2">Amount</div>
              <div class="text-xs text-gray-500 break">
                {{ prettifyBalance(input.value, 'DOGE') }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-1 text-center mx-auto">
          <ChevronDoubleRightIcon class="h-4 w-4 text-gray-500" aria-hidden="true" />
        </div>

        <div class="col-span-5 bg-teal-50 border-2 border-teal-300 border-dashed py-2 px-1 rounded-lg">
          <div class="text-center text-sm text-teal-900">Outputs</div>
          <div class="mt-2 space-y-2 text-xs">
            <div class="border-2 border-teal-300 bg-teal-100 rounded p-1 space-y-2" v-for="output in outputs">
              <template v-if="output.address">
                <div>{{ $t('Common.Address') }}</div>
                <div class="text-xs text-gray-500 break-all">
                  {{ prettifyTxId(output.address, 4) }}
                </div>
              </template>
              <template v-if="output.value">
                <div class="mt-2">{{ $t('Common.Amount') }}</div>
                <div class="text-xs text-gray-500 break-all">
                  {{ prettifyBalance(output.value, 'DOGE') }}
                </div>
              </template>
              <template v-if="output.script">
                <div class="mt-2">Script</div>
                <div class="text-xs text-gray-500 break-all">
                  {{ output.script }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <template v-else>
    <h3 class="text-base">{{ action.title }}</h3>

    <ul class="mt-6 space-y-4">
      <li v-for="access in action.description" class="flex items-start gap-x-2">
        <CheckBadgeIcon class="h-6 w-6 text-primary-blue shrink-0" />
        <div class="text-sm text-gray-700">{{ access }}</div>
      </li>
    </ul>

    <div class="w-full flex items-center justify-between mt-2">
      <span>Psbt Hex</span>
      <Copy :text="psbtHex" title="PSBT Hex copied" :showContent="false" />
    </div>

    <div class="w-full flex items-center justify-between mt-2" v-if="Number(fee) > 0">
      <span>Miner's Fee</span>
      <span>{{ calcBalance(fee, 8, 'DOGE') }}</span>
    </div>

    <div class="w-full flex items-center justify-between mt-2" v-if="Math.ceil(feeRate) > 0">
      <span>{{ $t('Common.FeeRate') }}</span>
      <span>≈{{ Math.ceil(feeRate) }} sat/vB</span>
    </div>

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
