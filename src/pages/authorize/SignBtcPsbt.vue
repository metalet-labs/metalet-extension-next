<script lang="ts" setup>
import { ref } from 'vue'
import Copy from '@/components/Copy.vue'
import { getBtcNetwork, getNetwork } from '@/lib/network'
import actions from '@/data/authorize-actions'
import { fetchRuneUtxoDetail } from '@/queries/runes'
import { getAddressFromScript } from '@metalet/utxo-wallet-service'
import { Psbt, networks, address as btcAddress, Transaction } from 'bitcoinjs-lib'
import { prettifyTxId, prettifyBalance, prettifyBalanceFixed } from '@/lib/formatters'
import { CheckBadgeIcon, ChevronDoubleRightIcon, ChevronLeftIcon } from '@heroicons/vue/24/solid'

const action = actions.SignBTCPsbt

const props = defineProps<{
  params: {
    psbtHex: string
    options: any
  }
}>()

const isShowingDetails = ref(false)

const psbtHex = props.params.psbtHex
const inputs = ref<
  {
    address: string
    value: number
    runes: {
      chain: string
      isNative: boolean
      queryable: boolean
      symbol: string
      amount: string
      runeId: string
      tokenName: string
      decimal: number
    }[]
  }[]
>([])
const outputs = ref<{ address: string; value: number; script: string }[]>([])
getNetwork().then(async (networkType) => {
  const psbtNetwork = networkType === 'mainnet' ? networks.bitcoin : networks.testnet
  const psbt = Psbt.fromHex(psbtHex, { network: psbtNetwork })
  for (let index = 0; index < psbt.data.inputs.length; index++) {
    const inputData = psbt.data.inputs[index]
    const runes = await fetchRuneUtxoDetail(
      Buffer.from(psbt.txInputs[index].hash).reverse().toString('hex'),
      psbt.txInputs[index].index
    )
    let address = ''
    let value = 0
    if (inputData?.witnessUtxo?.script) {
      address = btcAddress.fromOutputScript(inputData.witnessUtxo.script, psbtNetwork)
      value = inputData.witnessUtxo?.value || 0
    }
    if (inputData?.nonWitnessUtxo) {
      const tx = Transaction.fromBuffer(inputData.nonWitnessUtxo)
      const output = tx.outs[psbt.txInputs[index].index]
      address = btcAddress.fromOutputScript(output.script, psbtNetwork)
      value = output.value
    }
    inputs.value.push({ address, value, runes })
  }

  const btcNetwork = getBtcNetwork()

  outputs.value = psbt.txOutputs.map((out) => {
    let flag = true
    try {
      flag = getAddressFromScript(out.script, btcNetwork) !== out.address
    } catch (error) {
      flag = true
    }
    return {
      value: out.value,
      address: out.address || '',
      script: flag ? out.script.toString('hex') : '',
    }
  })
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
              <div>Address</div>
              <div class="text-xs text-gray-500 break-all">
                {{ prettifyTxId(input.address, 4) }}
              </div>
              <div class="mt-2">Amount</div>
              <div class="text-xs text-gray-500 break">
                {{ prettifyBalance(input.value, 'BTC') }}
              </div>
              <template v-if="input.runes.length">
                <div class="mt-2">Rune Details</div>
                <div v-for="rune in input.runes" class="space-y-2 divide-y divide-gray-200">
                  <div>Symbol</div>
                  <div class="text-xs text-gray-500 break-all">
                    {{ rune.tokenName }}
                  </div>
                  <div class="mt-2">Amount</div>
                  <div class="text-xs text-gray-500 break">
                    {{ prettifyBalanceFixed(Number(rune.amount), rune.symbol, rune.decimal) }}
                  </div>
                </div>
              </template>
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
                <div>Address</div>
                <div class="text-xs text-gray-500 break-all">
                  {{ prettifyTxId(output.address, 4) }}
                </div>
              </template>
              <template v-if="output.value">
                <div class="mt-2">Amount</div>
                <div class="text-xs text-gray-500 break-all">
                  {{ prettifyBalance(output.value, 'BTC') }}
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
      <span>PSBT</span>
      <Copy :text="psbtHex" title="PSBT Hex copied" :showContent="false" />
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
