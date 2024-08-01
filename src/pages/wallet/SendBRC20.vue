<script lang="ts" setup>
import { ref, computed } from 'vue'
import { getTags } from '@/data/assets'
import { addSafeUtxo } from '@/lib/utxo'
import { getBtcUtxos } from '@/queries/utxos'
import { useRoute, useRouter } from 'vue-router'
import { SymbolTicker } from '@/lib/asset-symbol'
import { useIconsStore } from '@/stores/IconsStore'
import { useQueryClient } from '@tanstack/vue-query'
import { getInscriptionUtxo } from '@/queries/utxos'
import { broadcastBTCTx } from '@/queries/transaction'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { prettifyBalanceFixed } from '@/lib/formatters'
import { CoinCategory } from '@/queries/exchange-rates'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { ScriptType, SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'
import { AssetLogo, Divider, FlexBox, FeeRateSelector, Button } from '@/components'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'
import TransactionResultModal, { type TransactionResult } from './components/TransactionResultModal.vue'

const cost = ref()
const route = useRoute()
const router = useRouter()
const isShowConfirm = ref(false)
const queryClient = useQueryClient()

const amount = ref(Number(route.params.amount))
const address = ref<string>(route.params.address as string)
const symbol = ref<SymbolTicker>(route.params.symbol as SymbolTicker)
const inscriptionId = ref<string>(route.params.inscriptionId as string)

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.BRC20, route.params.symbol as SymbolTicker) || '')

const { currentBTCWallet } = useChainWalletsStore()

const tags = getTags(CoinCategory.BRC20)

const recipient = ref('')
const operationLock = ref(false)
const currentRateFee = ref<number>()
const calcFee = ref<string>()
const rawTx = ref<string>()
const psbtHex = ref<string>()

const isOpenResultModal = ref(false)

const transactionResult = ref<TransactionResult | undefined>()

async function next() {
  if (operationLock.value) return

  if (!currentRateFee.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please select fee rate.',
    }
    isOpenResultModal.value = true
    return
  }

  operationLock.value = true

  try {
    const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH
    const utxo = await getInscriptionUtxo(inscriptionId.value, needRawTx)
    const utxos = await getBtcUtxos(address.value, needRawTx, true)
    const {
      fee,
      txOutputs,
      rawTx: _rawTx,
      psbtHex: _psbtHex,
    } = currentBTCWallet.value!.signTx(SignType.Transfer, {
      recipient: recipient.value,
      transferUTXOs: [utxo],
      feeRate: currentRateFee.value!,
      utxos,
    })

    cost.value = txOutputs.reduce(
      (total, out) => (total + out.address === currentBTCWallet.value?.getAddress() ? 0 : out.value),
      0
    )
    rawTx.value = _rawTx
    calcFee.value = fee
    psbtHex.value = _psbtHex
    isShowConfirm.value = true
  } catch (error) {
    console.error('Error in BTC transaction:', error)
    transactionResult.value = {
      status: 'failed',
      message: error as string,
    }
    isOpenResultModal.value = true
  } finally {
    operationLock.value = false
  }
}

async function send() {
  if (!rawTx.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'No Psbt.',
    }
    isOpenResultModal.value = true
    return
  }

  const txId = await broadcastBTCTx(rawTx.value).catch((err: Error) => {
    isShowConfirm.value = false
    transactionResult.value = {
      status: 'failed',
      message: err.message,
    }
    isOpenResultModal.value = true
    throw err
  })
  if (!txId) {
    transactionResult.value = {
      status: 'failed',
      message: 'Send failed',
    }
    return
  }

  const tx = Transaction.fromHex(rawTx.value)

  if (
    tx.outs.length > 1 &&
    getAddressFromScript(tx.outs[tx.outs.length - 1].script, currentBTCWallet.value!.getNetwork()) === address.value
  ) {
    await addSafeUtxo(address.value, `${txId}:${tx.outs.length - 1}`)
  }

  isShowConfirm.value = false
  operationLock.value = false
  queryClient.invalidateQueries({
    queryKey: ['balance', { address: address.value, symbol: symbol.value }],
  })

  router.replace({
    name: 'SendSuccess',
    params: {
      txId,
      chain: 'btc',
      symbol: symbol.value,
      amount: amount.value,
      address: recipient.value,
      coinCategory: CoinCategory.BRC20,
    },
  })
}
</script>

<template>
  <div class="space-y-6 h-full relative">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />

    <div class="space-y-4">
      <FlexBox d="col" ai="center">
        <AssetLogo :logo="logo" :symbol="symbol" chain="btc" type="network" class="w-15" />

        <div class="mt-3 text-base">{{ symbol }}</div>

        <div class="space-x-1">
          <div v-for="tag in tags" :key="tag.name" :class="['text-gray-primary', 'text-xs']">
            {{ tag.name }}
          </div>
        </div>
      </FlexBox>

      <Divider />
    </div>

    <div class="space-y-2">
      <div>Receiver</div>
      <textarea
        v-model="recipient"
        class="w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none break-all"
      />
    </div>
    <div class="space-y-2">
      <div>Amount</div>
      <div class="w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none">
        {{ amount }} {{ symbol }}
      </div>
    </div>
    <FeeRateSelector class="mt-6" v-model:currentRateFee="currentRateFee" />

    <Button
      type="primary"
      @click="next"
      :disabled="!currentRateFee || !recipient"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 w-61.5 h-12"
      :class="!currentRateFee || !recipient || operationLock ? 'opacity-50 cursor-not-allowed' : undefined"
    >
      <FlexBox ai="center" :gap="1" v-if="operationLock">
        <LoadingIcon />
        <span>Loading...</span>
      </FlexBox>
      <span v-else>Next</span>
    </Button>

    <Drawer v-model:open="isShowConfirm">
      <DrawerContent class="bg-white">
        <DrawerHeader>
          <FlexBox d="col" ai="center" :gap="4">
            <AssetLogo :logo="logo" :symbol="symbol" chain="btc" type="network" class="w-15" />
            <div class="text-base">{{ amount }} {{ symbol }}</div>
          </FlexBox>
        </DrawerHeader>
        <Divider class="mt-2" />
        <div class="p-4 space-y-4 text-ss">
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">From</div>
            <div class="break-all w-[228px]">{{ address }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">To</div>
            <div class="break-all w-[228px]">{{ recipient }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">Amount</div>
            <div class="break-all">{{ amount }} {{ symbol }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">Fees (Estimated)</div>
            <div>{{ prettifyBalanceFixed(Number(calcFee) || 0, 'BTC', 8) }}</div>
          </FlexBox>
          <Divider />
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">Total</div>
            <div>{{ prettifyBalanceFixed(cost || 0, 'BTC', 8) }}</div>
          </FlexBox>
        </div>
        <DrawerFooter>
          <FlexBox ai="center" jc="center" :gap="2">
            <DrawerClose>
              <Button type="light" class="w-[119px] h-12">Cancel</Button>
            </DrawerClose>
            <Button type="primary" class="w-[119px] h-12" @click="send">Confirm</Button>
          </FlexBox>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </div>
</template>

<style lang="css" scoped></style>
