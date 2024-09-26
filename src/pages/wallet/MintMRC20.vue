<script lang="ts" setup>
import Decimal from 'decimal.js'
import { ref, computed } from 'vue'
import { network } from '@/lib/network'
import { addSafeUtxo } from '@/lib/utxo'
import { getBtcUtxos } from '@/queries/utxos'
import { useRoute, useRouter } from 'vue-router'
import { Checkbox } from '@/components/ui/checkbox'
import { useIconsStore } from '@/stores/IconsStore'
import MetaPin from './components/MetaID/MetaPin.vue'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { broadcastBTCTx } from '@/queries/transaction'
import { CoinCategory } from '@/queries/exchange-rates'
import { prettifyBalanceFixed } from '@/lib/formatters'
import type { TransactionResult } from '@/global-types'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TransactionResultModal from './components/TransactionResultModal.vue'
import { AssetLogo, Divider, FlexBox, FeeRateSelector, Button, LoadingText } from '@/components'
import { ScriptType, SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'
import { useMRC20DetailQuery, useShovelMetaIdPinUtxosQuery, type MetaIdPinUTXO } from '@/queries/mrc20'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'

const route = useRoute()
const router = useRouter()
const totalFee = ref<number>()
const commitTxHex = ref<string>()
const revealTxHex = ref<string>()
const currentRateFee = ref<number>()
const isOpenConfirmModal = ref(false)
const metaPinUtxos = ref<MetaIdPinUTXO[]>([])
const transactionResult = ref<TransactionResult>()
const mrc20Id = ref(route.params.mrc20Id as string)
const address = ref(route.params.address as string)

const metaPinIds = computed(() => {
  return metaPinUtxos.value.map((item) => item.id)
})

const { currentBTCWallet } = useChainWalletsStore()
const needRawTx = ref(currentBTCWallet.value?.getScriptType() === ScriptType.P2PKH)

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.MRC20, mrc20Id.value) || '')

const enabled = computed(() => !!address.value && !!mrc20Id.value)

const { data: asset } = useMRC20DetailQuery(address, mrc20Id, { enabled })

const { data: metaPins } = useShovelMetaIdPinUtxosQuery(address, mrc20Id, needRawTx, { enabled })

const btnDisabled = computed(() => {
  return operationLock.value || !currentRateFee.value || metaPinUtxos.value.length === 0
})

const handleChange = (metaPin: MetaIdPinUTXO) => {
  if (metaPinIds.value.includes(metaPin.id)) {
    metaPinUtxos.value = metaPinUtxos.value.filter((item) => item.id !== metaPin.id)
  } else {
    metaPinUtxos.value.push(metaPin)
  }
}

const popConfirm = async () => {
  if (metaPinUtxos.value.length == 0) {
    transactionResult.value = {
      status: 'warning',
      message: 'Please select at least one metaPin.',
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
    const { commitTx, revealTx } = currentBTCWallet.value!.signTx(SignType.MRC20_MINT, {
      utxos,
      id: mrc20Id.value,
      metaIdPinUtxos: metaPinUtxos.value,
      commitFeeRate: currentRateFee.value,
      revealFeeRate: currentRateFee.value,
      flag: 'metaid',
    })
    commitTxHex.value = commitTx.rawTx
    revealTxHex.value = revealTx.rawTx
    totalFee.value = new Decimal(commitTx.fee).add(revealTx.fee).toNumber()
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

async function next() {
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
      message: 'No RawTx',
    }
    isOpenResultModal.value = true
  }
}

async function send() {
  if (operationLock.value) return

  operationLock.value = true

  const sendRes = await next()
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
      symbol: asset.value!.tokenName,
      // TODO: add amount
      amount: 'Mint',
      address: address.value,
      coinCategory: CoinCategory.MRC20,
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
        <div class="text-base">{{ asset.tokenName }}</div>
      </FlexBox>
      <Divider />
    </div>

    <div class="grid grid-cols-3 gap-2 w-full">
      <div v-for="metaPin in metaPins" class="relative">
        <Checkbox
          class="absolute right-1 top-1 z-10 bg-white"
          @update:checked="handleChange(metaPin)"
          :checked="metaPinIds.includes(metaPin.id)"
        />
        <MetaPin
          :key="metaPin.id"
          :pop="metaPin.pop"
          :popLv="metaPin.popLv"
          :content="metaPin.content"
          :value="metaPin.satoshis"
          :contentType="metaPin.contentType || ''"
          :contentSummary="metaPin.contentSummary || ''"
          :contentTypeDetect="metaPin.contentTypeDetect || ''"
        />
      </div>
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
          <FlexBox d="col" ai="center">
            <AssetLogo :logo="logo" :symbol="asset.symbol" :chain="asset.chain" type="network" class="w-15" />
          </FlexBox>
        </DrawerHeader>
        <Divider class="mt-2" />
        <div class="p-4 space-y-4 text-ss">
          <FlexBox ai="center" jc="between">
            <!-- TODO: add amount -->
            <div class="text-gray-primary">{{ $t('Common.Amount') }}</div>
            <!-- <div class="break-all">{{ (amount || 0) * (Number(asset.termsAmount) || 0) }}</div> -->
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
