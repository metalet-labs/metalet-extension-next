<script lang="ts" setup>
import { network } from '@/lib/network'
import { computed, ref, Ref } from 'vue'
import { isOfficialNft } from '@/lib/nft'
import Modal from '@/components/Modal.vue'
import { useQueryClient } from '@tanstack/vue-query'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMetacontractsQuery } from '@/queries/nfts'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import { API_NET, API_TARGET, NftManager } from 'meta-contract'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TransactionResultModal, { type TransactionResult } from './components/TransactionResultModal.vue'
import { Divider } from '@/components'

const queryClient = useQueryClient()

const props = defineProps<{
  codehash: string
  genesis: string
  tokenIndex: number
}>()

const { getAddress, currentMVCWallet } = useChainWalletsStore()
const address = getAddress(Chain.MVC)
const codehash = computed(() => props.codehash)
const genesis = computed(() => props.genesis)
const tokenIndex = computed(() => props.tokenIndex)

const { isLoading, data: metaContracts } = useMetacontractsQuery(
  { address, codehash, genesis },
  { enabled: computed(() => !!address.value) }
)

const infoDetail = computed(() => {
  if (metaContracts.value?.length) {
    return metaContracts.value[0]
  }
})

const recipient = ref('')

const isOpenConfirmModal = ref(false)
const isOpenResultModal = ref(false)
const operationLock = ref(false)
const transactionResult: Ref<undefined | TransactionResult> = ref()

async function transfer() {
  if (operationLock.value) return

  operationLock.value = true

  const privateKey = currentMVCWallet.value!.getPrivateKey()

  const nftManager = new NftManager({
    network: network.value as API_NET,
    apiTarget: API_TARGET.MVC,
    purse: privateKey,
  })

  // Pick the largest utxo from wallet to pay the transaction
  const largestUtxo = await nftManager.api
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

  const transferRes = await nftManager
    .transfer({
      codehash: codehash.value,
      genesis: genesis.value,
      tokenIndex: tokenIndex.value.toString(),
      senderWif: privateKey,
      receiverAddress: recipient.value,
      utxos: [largestUtxo],
    })
    .catch((err) => {
      isOpenConfirmModal.value = false
      transactionResult.value = {
        status: 'failed',
        message: err,
      }

      isOpenResultModal.value = true
      throw err
    })
  if (transferRes && transferRes.txid) {
    isOpenConfirmModal.value = false
    transactionResult.value = {
      status: 'success',
      txId: transferRes.txid,
      recipient: recipient.value,
      nft: {
        name: infoDetail.value!.name!,
        tokenIndex: tokenIndex.value,
        cover: infoDetail.value!.imgUrl!,
      },
    }

    isOpenResultModal.value = true

    // 刷新query
    queryClient.invalidateQueries({
      queryKey: ['nftCollections', { address: address.value }],
    })
  }

  operationLock.value = false
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="grow space-y-4">
      <div class="flex items-center gap-3 rounded-md py-4" v-if="infoDetail">
        <div class="h-[68px] w-[68px] overflow-hidden rounded-lg">
          <img :src="infoDetail.imgUrl" class="object-cover" />
        </div>

        <div class="space-y-0.5">
          <div class="flex items-center gap-1 text-xs text-blue-primary">
            {{ infoDetail.name }}
            <CheckBadgeIcon class="h-4 w-4 text-blue-primary" v-if="isOfficialNft(infoDetail.genesis)" />
          </div>

          <div class="flex items-center justify-center text-lg">
            {{ infoDetail.seriesName }} #{{ infoDetail.tokenIndex }}
          </div>
        </div>
      </div>

      <Divider />

      <div class="space-y-2">
        <div class="texg-sm font-medium">Receive Address</div>
        <textarea
          v-model="recipient"
          placeholder="Recipient's address"
          class="border border-blue-primary w-full rounded-lg p-2 text-sm h-16 focus:outline-none focus:ring-0"
        />
      </div>
    </div>

    <div class="pt-6 pb-2 flex justify-center">
      <button
        @click="isOpenConfirmModal = true"
        :disabled="!recipient || !recipient.length"
        class="w-61.5 rounded-3xl py-3 bg-blue-primary text-center text-base text-white disabled:opacity-50"
      >
        Transfer
      </button>
    </div>

    <Modal v-model:is-open="isOpenConfirmModal" :title="$t('Common.Confirm')">
      <template #title>Confirm Transaction</template>

      <template #body>
        <div class="mt-4 space-y-4">
          <div>
            <div class="flex items-center gap-4 rounded-md bg-gray-100 p-4" v-if="infoDetail">
              <div class="h-12 w-12 overflow-hidden rounded">
                <img :src="infoDetail.imgUrl" class="object-cover" v-if="infoDetail.imgUrl" />
              </div>

              <div>
                <h3 class="text-sm">{{ infoDetail.name }}</h3>
                <div class="text-xs text-gray-500">{{ '# ' + tokenIndex }}</div>
              </div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="label">{{ $t('Common.Address') }}</div>
            <div class="value break-all text-sm">{{ recipient }}</div>
          </div>
        </div>
      </template>

      <template #control>
        <div v-if="operationLock">
          <div class="w-full py-3 text-center text-sm text-gray-500">Operating...</div>
        </div>
        <div class="flex items-center justify-center gap-2" v-else>
          <button
            class="bg-blue-light w-30 rounded-3xl py-3 text-ss text-blue-primary"
            @click="isOpenConfirmModal = false"
          >
            {{ $t('Common.Cancel') }}
          </button>
          <button class="bg-blue-primary w-30 rounded-3xl py-3 text-ss text-white" @click="transfer">{{ $t('Common.Confirm') }}</button>
        </div>
      </template>
    </Modal>

    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm text-gray-500;
}
</style>
