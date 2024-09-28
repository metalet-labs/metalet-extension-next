<script lang="ts" setup>
import Decimal from 'decimal.js'
import { ref, computed } from 'vue'
import { getTags } from '@/data/assets'
import { getNetwork } from '@/lib/network'
import { useRoute, useRouter } from 'vue-router'
import { API_NET, FtManager } from 'meta-contract'
import { useMVCTokenQuery } from '@/queries/tokens'
import { useQueryClient } from '@tanstack/vue-query'
import LoadingIcon from '@/components/LoadingIcon.vue'
import type { TransactionResult } from '@/global-types'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { AssetLogo, Divider, FlexBox, Button } from '@/components'
import TransactionResultModal from './components/TransactionResultModal.vue'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'
import { prettifyAddress } from '@/lib/formatters'

const route = useRoute()
const router = useRouter()
const symbol = ref(route.params.symbol as string)
const genesis = ref(route.params.genesis as string)
const address = ref(route.params.address as string)

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.MetaContract, route.params.genesis as string) || '')

const { currentMVCWallet } = useChainWalletsStore()

const tags = getTags(CoinCategory.MetaContract)

// 用户拥有的代币资产
const { isLoading, data: asset } = useMVCTokenQuery(address, genesis, {
  enabled: computed(() => !!address.value && !!genesis.value),
})

const balance = computed(() => {
  if (asset.value) {
    return new Decimal(asset.value.balance!.total).div(10 ** asset.value.decimal).toNumber()
  }
})

// form
const amount = ref('')
const amountInSats = computed(() => {
  const _amount = Number(amount.value)
  if (Number.isNaN(amount)) return 0
  return _amount * 10 ** asset.value!.decimal
})
const recipient = ref('')

const isOpenConfirmModal = ref(false)
const popConfirm = () => {
  isOpenConfirmModal.value = true
}
const isOpenResultModal = ref(false)
const transactionResult = ref<TransactionResult>()

const operationLock = ref(false)
async function send() {
  if (operationLock.value) return

  operationLock.value = true

  const privateKey = currentMVCWallet.value!.getPrivateKey()

  const network = await getNetwork()

  const ftManager = new FtManager({
    network: network as API_NET,
    purse: privateKey,
  })

  // Pick the largest utxo from wallet to pay the transaction
  const largestUtxo = await ftManager.api
    .getUnspents(address.value)
    .then((utxos) => {
      return utxos.reduce((prev, curr) => {
        if (curr.satoshis > prev.satoshis) return curr
        return prev
      })
    })
    .then((utxo) => {
      // add wif to utxo
      return {
        ...utxo,
        wif: privateKey,
      }
    })

  const transferRes = await ftManager
    .transfer({
      codehash: asset.value?.codeHash!,
      genesis: asset.value?.genesis!,
      senderWif: privateKey,
      receivers: [
        {
          address: recipient.value,
          amount: amountInSats.value.toString(),
        },
      ],
      utxos: [largestUtxo],
    })
    .catch((err) => {
      isOpenConfirmModal.value = false
      if (err instanceof Error) {
        if (err.message === 'Too many token-utxos, should merge them to continue.') {
          transactionResult.value = {
            router: 'ft-merge',
            status: 'failed',
            message: err.message,
            confirmText: 'Merge',
          }
        } else {
          transactionResult.value = {
            router: 'ft-merge',
            status: 'failed',
            message: err.message,
            confirmText: 'Merge',
          }
        }
      } else {
        transactionResult.value = {
          status: 'failed',
          message: err?.message || err,
        }
      }

      isOpenResultModal.value = true
    })
  if (transferRes && transferRes.txid) {
    isOpenConfirmModal.value = false
    router.replace({
      name: 'SendSuccess',
      params: {
        txId: transferRes.txid,
        chain: 'mvc',
        symbol: symbol.value,
        amount: amount.value,
        address: recipient.value,
        coinCategory: CoinCategory.MetaContract,
      },
      query: {
        genesis: genesis.value,
      },
    })
  }

  operationLock.value = false
}
</script>

<template>
  <div class="space-y-6 h-full relative" v-if="asset && genesis">
    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />

    <div class="space-y-4">
      <FlexBox d="col" ai="center">
        <AssetLogo :logo="logo" :symbol="symbol" :chain="asset.chain" type="network" class="w-15" logo-size="size-6" />

        <div class="mt-3 text-base">{{ symbol }}</div>

        <div
          :key="tag.name"
          v-for="tag in tags"
          :style="`background-color:${tag.bg};color:${tag.color};`"
          :class="['px-1', 'py-0.5', 'rounded', 'text-xs', 'inline-block', 'mt-2']"
        >
          {{ tag.name }}
        </div>
      </FlexBox>

      <Divider />
    </div>

    <div class="space-y-2">
      <div>{{ $t('Common.Receiver') }}</div>
      <textarea
        v-model="recipient"
        class="w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none break-all"
      />
    </div>
    <div class="space-y-2">
      <FlexBox ai="center" jc="between">
        <span>{{ $t('Common.Amount') }}</span>
        <span class="text-gray-primary text-xs">
          <span>Balance:</span>
          <span v-if="balance">{{ balance }} {{ symbol }}</span>
          <span v-else>--</span>
        </span>
      </FlexBox>
      <input
        min="0"
        type="number"
        step="0.00001"
        v-model="amount"
        :max="asset.balance!.total.toNumber()"
        class="mt-2 w-full rounded-lg p-3 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none"
      />
    </div>

    <Button
      type="primary"
      @click="isOpenConfirmModal = true"
      :disabled="!recipient"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 w-61.5 h-12"
      :class="!recipient || operationLock ? 'opacity-50 cursor-not-allowed' : undefined"
    >
      <FlexBox ai="center" :gap="1" v-if="operationLock">
        <LoadingIcon />
        <span>Loading...</span>
      </FlexBox>
      <span v-else>{{ $t('Common.Next') }}</span>
    </Button>

    <Drawer v-model:open="isOpenConfirmModal">
      <DrawerContent class="bg-white">
        <DrawerHeader>
          <FlexBox d="col" ai="center" :gap="4">
            <AssetLogo :logo="logo" :symbol="symbol" :chain="asset.chain" type="network" class="w-15" />
            <div class="text-base">{{ amount }} {{ symbol }}</div>
          </FlexBox>
        </DrawerHeader>
        <Divider class="mt-2" />
        <div class="p-4 space-y-4 text-ss">
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">{{ $t('Common.From') }}</div>
            <div class="break-all" :title="address">{{ prettifyAddress(address) }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">{{ $t('Common.To') }}</div>
            <div class="break-all" :title="recipient">{{ prettifyAddress(recipient) }}</div>
          </FlexBox>
          <FlexBox ai="center" jc="between">
            <div class="text-gray-primary">{{ $t('Common.Amount') }}</div>
            <div class="break-all">{{ amount }} {{ symbol }}</div>
          </FlexBox>
        </div>
        <DrawerFooter>
          <FlexBox ai="center" jc="center" :gap="2">
            <DrawerClose>
              <Button type="light" class="w-[119px] h-12">{{ $t('Common.Cancel') }}</Button>
            </DrawerClose>
            <Button
              @click="send"
              type="primary"
              :class="['w-[119px] h-12', { 'opacity-50 cursor-not-allowed space-x-1': operationLock }]"
            >
              <LoadingIcon v-if="operationLock" />
              <span>{{ $t('Common.Confirm') }}</span>
            </Button>
          </FlexBox>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </div>
  <div v-else class="text-center text-gray-primary w-full py-3 text-base">Token can not found.</div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
