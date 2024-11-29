<script setup lang="ts">
import { FEEB } from '@/data/config'
import { computed, ref, watch } from 'vue'
import { getNetwork } from '@/lib/network'
import Avatar from '@/components/Avatar.vue'
import { UseImage } from '@vueuse/components'
import { useIconsStore } from '@/stores/IconsStore'
import { Chain } from '@metalet/utxo-wallet-service'
import type { MetaContractAsset } from '@/data/assets'
import LoadingIcon from '@/components/LoadingIcon.vue'
import { CoinCategory } from '@/queries/exchange-rates'
import { useMetaContractAssetsQuery } from '@/queries/tokens'
import { API_NET, API_TARGET, FtManager } from 'meta-contract'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TransactionResultModal, { type TransactionResult } from '@/pages/wallet/components/TransactionResultModal.vue'

const operation = ref('')
const loading = ref(false)
const isRefresh = ref(true)
const assetLoading = ref(true)
const currentGenesis = ref('')
const currentCodehash = ref('')
const isOpenResultModal = ref(false)
const transactionResult = ref<TransactionResult>()
const ftAsssets = ref<(MetaContractAsset & { utxoCount: number })[]>([])

const splitCount = 10
const testSplit = false
const NeedToMergeCount = 3

const { getIcon } = useIconsStore()

type Receiver = {
  address: string
  amount: string
}

const { getAddress, currentMVCWallet } = useChainWalletsStore()

const address = getAddress(Chain.MVC)

const split = async (genesis: string, codehash: string, symbol: string, decimal: number) => {
  try {
    loading.value = true
    operation.value = 'split'
    currentGenesis.value = genesis
    currentCodehash.value = codehash
    const network: API_NET = (await getNetwork()) as API_NET
    const purse = currentMVCWallet.value!.getPrivateKey()
    const ftManager = new FtManager({
      network,
      apiTarget: API_TARGET.CYBER3,
      purse,
      feeb: FEEB,
    })
    let receivers: Receiver[] = []
    for (let i = 0; i < splitCount; i++) {
      receivers.push({ address: address.value, amount: '1' })
    }
    let { txid: splitTxId } = await ftManager
      .transfer({
        genesis,
        codehash,
        receivers,
        senderWif: purse,
      })
      .catch((e) => {
        throw e
      })
    isRefresh.value = true
    isOpenResultModal.value = true
    transactionResult.value = {
      chain: 'mvc',
      status: 'success',
      txId: splitTxId,
      fromAddress: address.value,
      toAddress: address.value,
      amount: receivers.reduce((acc, cur) => acc + Number(cur.amount), 0),
      token: {
        symbol: symbol,
        decimal,
      },
    }
  } catch (error) {
    isOpenResultModal.value = true
    transactionResult.value = {
      status: 'failed',
      message: error as string,
    }
  } finally {
    loading.value = false
  }
}

const merge = async (genesis: string, codehash: string) => {
  try {
    currentGenesis.value = genesis
    currentCodehash.value = codehash
    operation.value = 'merge'
    const network: API_NET = (await getNetwork()) as API_NET
    const purse = currentMVCWallet.value!.getPrivateKey()
    const ftManager = new FtManager({
      network,
      apiTarget: API_TARGET.CYBER3,
      purse,
      feeb: FEEB,
    })
    loading.value = true
    const { txids } = await ftManager
      .totalMerge({
        genesis,
        codehash,
        ownerWif: purse,
      })
      .catch((e) => {
        isOpenResultModal.value = true
        transactionResult.value = {
          status: 'failed',
          message: e,
        }
        throw e
      })
    isRefresh.value = true
    isOpenResultModal.value = true
    transactionResult.value = {
      chain: 'mvc',
      status: 'successTxs',
      txIds: txids,
    }
  } catch (error) {
    transactionResult.value = {
      status: 'failed',
      message: error as string,
    }
  } finally {
    loading.value = false
  }
}

const { isLoading, data: mvcAssets } = useMetaContractAssetsQuery(address, {
  enabled: computed(() => !!address.value),
  autoRefresh: computed(() => !!address.value),
})

// TODO: Change computed
watch(
  [mvcAssets, currentMVCWallet, isRefresh, address],
  async ([assets, _currentMVCWallet, _isRefresh, _address]) => {
    if (assets && _isRefresh && _address && _currentMVCWallet) {
      assetLoading.value = true
      const _assets: (MetaContractAsset & { utxoCount: number })[] = []
      for (let asset of assets || []) {
        const { codeHash, genesis } = asset
        const network: API_NET = (await getNetwork()) as API_NET
        const purse = _currentMVCWallet.getPrivateKey()
        const manager = new FtManager({
          network,
          apiTarget: API_TARGET.CYBER3,
          purse,
          feeb: FEEB,
        })
        await manager.api.getFungibleTokenUnspents(codeHash, genesis, _address).then((data: any) => {
          _assets.push({
            ...asset,
            utxoCount: data.length,
          })
          isRefresh.value = false
        })
      }
      _assets.sort((a, b) => b.tokenName.localeCompare(a.tokenName))
      ftAsssets.value = _assets
      assetLoading.value = false
    }
  },
  { immediate: true }
)

const hasMergeToken = computed(() => {
  return ftAsssets.value.some((asset) => asset.utxoCount > NeedToMergeCount)
})
</script>

<template>
  <div class="min-h-full flex flex-col">
    <div class="text-2xl font-medium">FT Merge</div>
    <div class="mt-2 text-gray-primary text-xs">
      Due to the technical nature of UTXO, when there are excessive UTXOs for a token, issues such as transaction
      failure loops may arise. The merging tool will automatically help you consolidate your scattered UTXOs into one.
    </div>
    <div class="py-4 flex gap-3 items-center">
      <Avatar :id="address" />
      <div class="flex flex-col gap-1">
        <div class="text-sm font-medium">MVC(Bitcoin sidechain) Address</div>
        <div class="text-gray-primary text-xs">{{ address }}</div>
      </div>
    </div>
    <div class="-mx-5 px-5 bg-gray-light py-3">Token</div>
    <div class="py-16 text-center text-gray-primary" v-if="isLoading || assetLoading">Token List Loading...</div>
    <div v-for="(asset, index) in ftAsssets" :key="index" v-else-if="hasMergeToken || testSplit">
      <div class="flex items-center justify-between py-3" v-if="asset.utxoCount > NeedToMergeCount || testSplit">
        <div class="flex items-center gap-3">
          <UseImage :src="getIcon(CoinCategory.MetaContract, asset.genesis) || ''" class="h-10 w-10 rounded-md">
            <template #loading>
              <div class="h-10 w-10 text-center leading-10 rounded-full text-white text-base bg-[#1E2BFF]">
                {{ asset.symbol[0].toLocaleUpperCase() }}
              </div>
            </template>
            <template #error>
              <div class="h-10 w-10 text-center leading-10 rounded-full text-white text-base bg-[#1E2BFF]">
                {{ asset.symbol[0].toLocaleUpperCase() }}
              </div>
            </template>
          </UseImage>
          <div class="flex flex-col gap-1">
            <span class="text-sm">{{ asset.tokenName }}</span>
            <span class="text-gray-primary text-xs">UTXO Count:{{ asset.utxoCount }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="testSplit"
            :disabled="loading"
            @click="split(asset.genesis!, asset.codeHash!, asset.symbol, asset.decimal)"
            :class="[
              { 'cursor-not-allowed': loading },
              'text-primary-blue py-2 px-4 rounded-3xl bg-blue-light text-xs',
            ]"
          >
            <div class="flex items-center gap-1 w-12 justify-center">
              <LoadingIcon
                class="w-4 text-primary-blue"
                v-if="
                  loading &&
                  currentGenesis === asset.genesis &&
                  currentCodehash === asset.codeHash &&
                  operation === 'split'
                "
              />
              <span>Split</span>
            </div>
          </button>
          <button
            :disabled="loading"
            @click="merge(asset.genesis!, asset.codeHash!)"
            :class="[
              { 'cursor-not-allowed': loading },
              'text-primary-blue py-2 px-4 rounded-3xl bg-blue-light text-xs',
            ]"
          >
            <div class="flex items-center gap-1 w-14 justify-center">
              <LoadingIcon
                class="w-4 text-primary-blue"
                v-if="
                  loading &&
                  currentGenesis === asset.genesis &&
                  currentCodehash === asset.codeHash &&
                  operation === 'merge'
                "
              />
              <span>Merge</span>
            </div>
          </button>
        </div>
      </div>
    </div>
    <div class="py-16 text-center text-gray-primary" v-else>No tokens need to be merged.</div>

    <TransactionResultModal v-model:is-open-result="isOpenResultModal" :result="transactionResult" />
  </div>
</template>

<style lang="css" scoped>
.label {
  @apply text-sm  text-gray-500;
}

.value {
  @apply text-sm text-gray-700;
}
</style>
