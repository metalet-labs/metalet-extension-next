<script lang="ts" setup>
import Decimal from 'decimal.js'
import { ref, computed } from 'vue'
import { network } from '@/lib/network'
import { addSafeUtxo } from '@/lib/utxo'
import { getBtcUtxos } from '@/queries/utxos'
import { transferToNumber } from '@/lib/helpers'
import { useRoute, useRouter } from 'vue-router'
import { useIconsStore } from '@/stores/IconsStore'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { broadcastBTCTx } from '@/queries/transaction'
import { CoinCategory } from '@/queries/exchange-rates'
import { prettifyBalanceFixed } from '@/lib/formatters'
import type { TransactionResult } from '@/global-types'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { useMRC20DetailQuery, getMRC20Utxos } from '@/queries/mrc20'
import TransactionResultModal from './components/TransactionResultModal.vue'
import { AssetLogo, Divider, FlexBox, FeeRateSelector, Button, LoadingText } from '@/components'
import { ScriptType, SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'
import { getTags } from '@/data/assets'

const route = useRoute()
const recipient = ref('')
const commitTxHex = ref('')
const revealTxHex = ref('')
const router = useRouter()
const totalFee = ref<number>()
const currentRateFee = ref<number>()
const isOpenConfirmModal = ref(false)
const transactionResult = ref<TransactionResult>()

const tags = getTags(CoinCategory.MRC20)

const mrc20Id = ref(route.params.mrc20Id as string)
const address = ref(route.params.address as string)

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.MRC20, mrc20Id.value) || '')

const { data: asset } = useMRC20DetailQuery(address, mrc20Id, {
  enabled: computed(() => !!address.value && !!mrc20Id.value),
})

const { currentBTCWallet } = useChainWalletsStore()

const amount = ref<number>()

const balance = computed(() => {
  if (asset.value?.balance) {
    return asset.value.balance.total.toNumber()
  }
})

const confirmBalance = computed(() => {
  if (asset.value?.balance) {
    return asset.value.balance.confirmed.toNumber()
  }
})

const unconfirmedBalance = computed(() => {
  if (asset.value?.balance) {
    return asset.value.balance.unconfirmed.toNumber()
  }
})

const btnDisabled = computed(() => {
  return (
    !recipient.value ||
    !amount.value ||
    (amount.value && amount.value <= 0) ||
    operationLock.value ||
    !currentRateFee.value ||
    balance.value === undefined ||
    balance.value === 0
  )
})

const popConfirm = async () => {
  if (!recipient.value) {
    transactionResult.value = {
      status: 'warning',
      message: "Please input recipient's address.",
    }
    isOpenResultModal.value = true
    return
  }
  if (!amount.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please enter the amount.',
    }
    isOpenResultModal.value = true
    return
  }

  const parts = transferToNumber(amount.value).split('.')

  if (!(parts.length < 2 || parts[1].length <= (asset.value?.decimal || 0))) {
    transactionResult.value = {
      status: 'warning',
      message: `The minimum decimal unit is ${transferToNumber(new Decimal(1).div(10 ** (asset.value?.decimal || 0)).toNumber())}`,
    }
    isOpenResultModal.value = true
    return
  }
  if (asset.value!.chain === 'btc' && !currentRateFee.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please enter the current fee rate.',
    }
    isOpenResultModal.value = true
    return
  }
  if (!currentRateFee.value) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please select fee rate.',
    }
    isOpenResultModal.value = true
    return
  }
  operationLock.value = true
  if (address.value !== currentBTCWallet.value!.getAddress()) {
    transactionResult.value = {
      status: 'warning',
      message: 'You are not the owner of this address.',
    }
    isOpenResultModal.value = true
    operationLock.value = false
    return
  }
  try {
    const needRawTx = currentBTCWallet.value!.getScriptType() === ScriptType.P2PKH
    const utxos = await getBtcUtxos(address.value, needRawTx, true)
    const mrc20Utxos = await getMRC20Utxos(address.value, asset.value!.mrc20Id, needRawTx)

    const { commitTx, revealTx } = currentBTCWallet.value!.signTx(SignType.MRC20_TRANSFER, {
      utxos,
      amount: new Decimal(amount.value).toFixed(),
      flag: 'metaid',
      commitFeeRate: currentRateFee.value,
      revealFeeRate: currentRateFee.value,
      mrc20Utxos,
      body: JSON.stringify([
        {
          vout: 1,
          id: mrc20Id.value,
          amount: new Decimal(amount.value).toFixed(),
        },
      ]),
      revealAddr: recipient.value,
    })

    commitTxHex.value = commitTx.rawTx
    revealTxHex.value = revealTx.rawTx
    totalFee.value = Number(commitTx.fee) + Number(revealTx.fee)
    isOpenConfirmModal.value = true
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

const isOpenResultModal = ref(false)

const operationLock = ref(false)

async function sendBTC() {
  if (commitTxHex.value && revealTxHex.value) {
    const commitTxId = await broadcastBTCTx(commitTxHex.value).catch((err: Error) => {
      isOpenConfirmModal.value = false
      transactionResult.value = {
        status: 'failed',
        message: err.message,
      }
      isOpenResultModal.value = true
      operationLock.value = false
      throw err
    })

    const revealTxId = await broadcastBTCTx(revealTxHex.value).catch((err: Error) => {
      isOpenConfirmModal.value = false
      transactionResult.value = {
        status: 'failed',
        message: err.message,
      }
      isOpenResultModal.value = true
      operationLock.value = false
      throw err
    })

    const tx = Transaction.fromHex(commitTxHex.value)
    if (
      tx.outs.length > 1 &&
      getAddressFromScript(tx.outs[tx.outs.length - 1].script, currentBTCWallet.value!.getNetwork()) === address.value
    ) {
      await addSafeUtxo(address.value, `${commitTxId}:${tx.outs.length - 1}`)
    }

    return { commitTxId, revealTxId }
  } else {
    isOpenConfirmModal.value = false
    transactionResult.value = {
      status: 'failed',
      message: 'No Psbt',
    }
    isOpenResultModal.value = true
  }
}

async function send() {
  if (operationLock.value) return

  operationLock.value = true

  const sendProcessor = sendBTC
  const sendRes = await sendProcessor()
  if (!sendRes || !sendRes.revealTxId) {
    transactionResult.value = {
      status: 'failed',
      message: 'Send failed',
    }
    operationLock.value = false
    return
  }

  isOpenConfirmModal.value = false
  operationLock.value = false
  router.replace({
    name: 'SendSuccess',
    params: {
      txId: sendRes.revealTxId,
      chain: 'btc',
      symbol: asset.value!.symbol,
      amount: amount.value,
      address: recipient.value,
      coinCategory: CoinCategory.Rune,
    },
  })
}
</script>

<template>
  <FlexBox d="col" ai="center" v-if="asset" class="w-full h-full relative space-y-6">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />

    <div class="space-y-4 w-full">
      <FlexBox d="col" ai="center" :gap="3">
        <AssetLogo :logo="logo" :symbol="asset.symbol" :chain="asset.chain" type="network" class="w-15" />
        <div
          :key="tag.name"
          v-for="tag in tags"
          :style="`background-color:${tag.bg};color:${tag.color};`"
          :class="['px-1', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'mt-2']"
        >
          {{ tag.name }}
        </div>
      </FlexBox>
    </div>

    <div class="space-y-2 w-full">
      <div>Receiver</div>
      <textarea
        v-model="recipient"
        class="w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none break-all"
      />
    </div>

    <div class="space-y-2 w-full">
      <FlexBox ai="center" jc="between">
        <span>Amount</span>
        <span
          class="text-gray-primary text-xs cursor-pointer hover:underline"
          @click="amount = new Decimal(confirmBalance || 0).dividedBy(10 ** (asset?.decimal || 0)).toNumber()"
        >
          <template v-if="balance !== undefined">
            <span v-if="confirmBalance !== undefined">
              {{ prettifyBalanceFixed(confirmBalance, '', asset.decimal, asset.decimal) }}
            </span>
            <span class="text-gray-primary" v-if="unconfirmedBalance">
              +{{
                prettifyBalanceFixed(
                  unconfirmedBalance,
                  '',
                  asset.decimal,
                  confirmBalance === Math.floor(unconfirmedBalance) ? 0 : asset.decimal
                )
              }}
            </span>
          </template>
          <span v-else>--</span>
        </span>
      </FlexBox>
      <input
        min="0"
        type="number"
        v-model="amount"
        :max="confirmBalance"
        :step="new Decimal(1).div(10 ** asset.decimal).toNumber()"
        class="mt-2 w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none"
      />
    </div>

    <FeeRateSelector class="w-full" v-model:currentRateFee="currentRateFee" v-if="asset.chain === 'btc'" />

    <Button
      type="primary"
      @click="popConfirm"
      :disabled="btnDisabled"
      :class="[
        { 'opacity-50 cursor-not-allowed': btnDisabled },
        'absolute bottom-4 left-1/2 -translate-x-1/2 w-61.5 h-12',
      ]"
    >
      <div class="flex items-center gap-2" v-if="operationLock">
        <LoadingIcon />
        <span>Loading...</span>
      </div>
      <span v-else>Next</span>
    </Button>

    <Drawer v-model:open="isOpenConfirmModal">
      <DrawerContent class="bg-white">
        <DrawerHeader>
          <FlexBox d="col" ai="center" :gap="4">
            <AssetLogo :logo="logo" :symbol="asset.symbol" :chain="asset.chain" type="network" class="w-15" />
            <div class="text-base">{{ transferToNumber(amount || 0) }} {{ asset.symbol }}</div>
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
            <div class="break-all">{{ transferToNumber(amount || 0) }} {{ asset.symbol }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">Fees (Estimated)</div>
            <div>{{ prettifyBalanceFixed(totalFee, 'BTC', 8) }}</div>
          </FlexBox>
        </div>
        <DrawerFooter>
          <FlexBox ai="center" jc="center" :gap="2">
            <DrawerClose>
              <Button type="light" class="w-[119px] h-12" @click="operationLock = false">Cancel</Button>
            </DrawerClose>
            <Button
              @click="send"
              type="primary"
              :class="['w-[119px] h-12', { 'opacity-50 cursor-not-allowed space-x-1': btnDisabled }]"
            >
              <LoadingIcon v-if="operationLock" />
              <span>Confirm</span>
            </Button>
          </FlexBox>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </FlexBox>
  <LoadingText text="Asset Loading..." v-else />
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
