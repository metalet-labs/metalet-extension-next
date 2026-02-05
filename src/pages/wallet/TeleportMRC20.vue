<script lang="ts" setup>
import Decimal from 'decimal.js'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Chain } from '@metalet/utxo-wallet-service'
import { useMRC20DetailQuery } from '@/queries/mrc20'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { 
  teleportMRC20, 
  estimateTeleportFee,
  getAvailableTargetChains,
  getChainDisplayName,
  getChainColor,
  type SupportedChain 
} from '@/lib/actions/teleport'
import { calcBalance, prettifyBalanceFixed } from '@/lib/formatters'
import { CoinCategory } from '@/queries/exchange-rates'
import { getTags } from '@/data/assets'
import type { TransactionResult } from '@/global-types'

import { AssetLogo, Divider, FlexBox, FeeRateSelector, DOGEFeeRateSelector, MVCFeeRateSelector, Button, LoadingText } from '@/components'
import LoadingIcon from '@/components/LoadingIcon.vue'
import TransactionResultModal from './components/TransactionResultModal.vue'
import TeleportConfirmModal from './components/TeleportConfirmModal.vue'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()

// 路由参数
const mrc20Id = ref(route.params.mrc20Id as string)
const tokenName = ref(route.params.name as string)
const fromChain = ref<SupportedChain>((route.params.fromChain as SupportedChain) || 'btc')

// Wallet Store
const { getAddress, currentBTCWallet, currentDOGEWallet, currentMVCWallet } = useChainWalletsStore()

// 地址
const btcAddress = getAddress(Chain.BTC)
const dogeAddress = getAddress(Chain.DOGE)
const mvcAddress = getAddress(Chain.MVC)

// 获取当前链的地址
const currentFromAddress = computed(() => {
  switch (fromChain.value) {
    case 'btc': return btcAddress.value
    case 'doge': return dogeAddress.value
    case 'mvc': return mvcAddress.value
    default: return btcAddress.value
  }
})

// 获取 MRC20 详情（当前 from 链）
const { data: asset } = useMRC20DetailQuery(
  computed(() => currentFromAddress.value),
  mrc20Id,
  { enabled: computed(() => !!currentFromAddress.value && !!mrc20Id.value) }
)

// 获取 BTC 链上的 MRC20 详情
const { data: btcMRC20Asset } = useMRC20DetailQuery(
  btcAddress,
  mrc20Id,
  { enabled: computed(() => !!btcAddress.value && !!mrc20Id.value) }
)

// 获取 DOGE 链上的 MRC20 详情
const { data: dogeMRC20Asset } = useMRC20DetailQuery(
  dogeAddress,
  mrc20Id,
  { enabled: computed(() => !!dogeAddress.value && !!mrc20Id.value) }
)

// From 链 token 余额
const fromChainTokenBalance = computed(() => {
  switch (fromChain.value) {
    case 'btc': return btcMRC20Asset.value?.balance?.confirmed?.toNumber() || 0
    case 'doge': return dogeMRC20Asset.value?.balance?.confirmed?.toNumber() || 0
    default: return 0
  }
})

// To 链 token 余额
const toChainTokenBalance = computed(() => {
  switch (toChain.value) {
    case 'btc': return btcMRC20Asset.value?.balance?.confirmed?.toNumber() || 0
    case 'doge': return dogeMRC20Asset.value?.balance?.confirmed?.toNumber() || 0
    default: return 0
  }
})

// 表单数据
const amount = ref<string>('')
const toChain = ref<SupportedChain>(getAvailableTargetChains(fromChain.value)[0])
const fromFeeRate = ref<number>()
const toFeeRate = ref<number>()

// 可选的目标链
const availableTargetChains = computed(() => getAvailableTargetChains(fromChain.value))

// 当源链改变时，重置目标链
watch(fromChain, (newFromChain) => {
  const targets = getAvailableTargetChains(newFromChain)
  if (!targets.includes(toChain.value)) {
    toChain.value = targets[0]
  }
})

// 余额
const balance = computed(() => {
  if (asset.value?.balance) {
    return asset.value.balance.total.toNumber()
  }
  return 0
})

const confirmBalance = computed(() => {
  if (asset.value?.balance) {
    return asset.value.balance.confirmed.toNumber()
  }
  return 0
})

// Tags
const tags = getTags(CoinCategory.MRC20)

// 状态
const operationLock = ref(false)
const isConfirmModalOpen = ref(false)
const isResultModalOpen = ref(false)
const transactionResult = ref<TransactionResult>()

// 费用预估
const estimatedFee = ref<{
  fromChainFee: number
  toChainFee: number
  totalFee: number
} | null>(null)

// 表单验证
const btnDisabled = computed(() => {
  return (
    !amount.value ||
    (amount.value && Number(amount.value) <= 0) ||
    Number(amount.value) > confirmBalance.value / (10 ** (asset.value?.decimal || 0)) ||
    operationLock.value ||
    !fromFeeRate.value ||
    !toFeeRate.value ||
    balance.value === 0
  )
})

// 打开确认弹窗
const openConfirmModal = async () => {
  if (btnDisabled.value) return
  
  operationLock.value = true
  
  try {
    // 预估费用
    const feeEstimate = await estimateTeleportFee({
      fromChain: fromChain.value,
      toChain: toChain.value,
      mrc20Id: mrc20Id.value,
      amount: amount.value,
      fromAddress: currentFromAddress.value!,
      fromFeeRate: fromFeeRate.value!,
      toFeeRate: toFeeRate.value!,
      noBroadcast: true,
    })
    
    estimatedFee.value = feeEstimate
    isConfirmModalOpen.value = true
  } catch (error) {
    console.error('Error estimating fee:', error)
    transactionResult.value = {
      status: 'failed',
      message: String(error),
    }
    isResultModalOpen.value = true
  } finally {
    operationLock.value = false
  }
}

// 执行 Teleport
const executeTeleport = async () => {
  if (operationLock.value) return
  
  operationLock.value = true
  
  try {
    const result = await teleportMRC20({
      fromChain: fromChain.value,
      toChain: toChain.value,
      mrc20Id: mrc20Id.value,
      amount: amount.value,
      fromAddress: currentFromAddress.value!,
      fromFeeRate: fromFeeRate.value!,
      toFeeRate: toFeeRate.value!,
      noBroadcast: false,
    })
    
    isConfirmModalOpen.value = false
    
    // 获取交易 ID
    const transferTxId = result.transferResult.revealTx.txId
    let arrivalTxId = ''
    if (result.arrivalResult.revealTxIds?.length) {
      arrivalTxId = result.arrivalResult.revealTxIds[0]
    } else if (result.arrivalResult.txids?.length) {
      arrivalTxId = result.arrivalResult.txids[0]
    }
    
    // 预处理交易 ID（如果有）
    const prepareTxId = result.prepareResult?.revealTx.txId || ''
    
    // 跳转到 Teleport 成功页面
    router.replace({
      name: 'TeleportSuccess',
      params: {
        fromChain: fromChain.value,
        toChain: toChain.value,
        symbol: tokenName.value,
        amount: amount.value,
        transferTxId,
        arrivalTxId,
      },
      query: {
        genesis: mrc20Id.value,
        prepareTxId: prepareTxId || undefined,
        icon: asset.value?.icon || undefined,
      },
    })
  } catch (error) {
    console.error('Teleport error:', error)
    isConfirmModalOpen.value = false
    transactionResult.value = {
      status: 'failed',
      message: String(error),
    }
    isResultModalOpen.value = true
  } finally {
    operationLock.value = false
  }
}

// 设置最大金额
const setMaxAmount = () => {
  if (asset.value) {
    amount.value = new Decimal(confirmBalance.value)
      .dividedBy(10 ** asset.value.decimal)
      .toString()
  }
}
</script>

<template>
  <FlexBox d="col" ai="center" class="w-full h-full relative space-y-6 overflow-y-auto pb-4" v-if="asset">
    <!-- 结果弹窗 -->
    <TransactionResultModal v-model:is-open-result="isResultModalOpen" :result="transactionResult" />
    
    <!-- 当前 Token 信息 -->
    <div class="w-full p-4 bg-gray-50 rounded-xl">
      <div class="flex items-center gap-3">
        <AssetLogo
          :logo="asset.icon"
          :symbol="asset.symbol"
          :chain="fromChain"
          type="network"
          class="w-12"
          logo-size="size-5"
        />
        <div class="flex-1">
          <div class="font-medium">{{ asset.tokenName }}</div>
          <div class="text-sm text-gray-500">
            {{ calcBalance(balance, asset.decimal, '') }} {{ asset.symbol }}
          </div>
        </div>
        <div 
          class="px-2 py-1 rounded text-xs text-white"
          :style="{ backgroundColor: getChainColor(fromChain) }"
        >
          {{ fromChain.toUpperCase() }}
        </div>
      </div>
    </div>

    <!-- From 网络 -->
    <div class="w-full space-y-2">
      <div class="text-sm font-medium">From</div>
      <div class="p-4 border rounded-xl bg-white">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-500 text-sm">Network</span>
          <div 
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            :style="{ backgroundColor: getChainColor(fromChain) + '20' }"
          >
            <span 
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: getChainColor(fromChain) }"
            ></span>
            <span class="font-medium">{{ getChainDisplayName(fromChain) }}</span>
          </div>
        </div>
        
        <!-- Amount 输入 -->
        <div class="space-y-2">
          <FlexBox ai="center" jc="between">
            <span class="text-gray-500 text-sm">Amount</span>
            <span 
              class="text-xs text-blue-primary cursor-pointer hover:underline"
              @click="setMaxAmount"
            >
              Max: {{ prettifyBalanceFixed(confirmBalance, '', asset.decimal, asset.decimal) }}
            </span>
          </FlexBox>
          <input
            min="0"
            type="number"
            v-model="amount"
            placeholder="Enter amount"
            class="w-full rounded-lg p-3 text-sm border border-gray-200 focus:border-blue-primary focus:outline-none"
          />
        </div>
        
        <!-- From Fee Rate -->
        <div class="mt-4">
          <FeeRateSelector 
            v-if="fromChain === 'btc'" 
            v-model:currentRateFee="fromFeeRate" 
          />
          <DOGEFeeRateSelector 
            v-else-if="fromChain === 'doge'" 
            v-model:currentRateFee="fromFeeRate" 
          />
          <MVCFeeRateSelector 
            v-else-if="fromChain === 'mvc'" 
            v-model:currentMVCRateFee="fromFeeRate" 
          />
          <!-- From Chain Balance -->
          <div class="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>Balance</span>
            <span>{{ prettifyBalanceFixed(fromChainTokenBalance, asset?.symbol || '', asset?.decimal || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 箭头 -->
    <div class="flex justify-center">
      <div class="w-10 h-10 rounded-full bg-blue-primary flex items-center justify-center">
        <ChevronDownIcon class="w-6 h-6 text-white" />
      </div>
    </div>

    <!-- To 网络 -->
    <div class="w-full space-y-2">
      <div class="text-sm font-medium">To</div>
      <div class="p-4 border rounded-xl bg-white">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-500 text-sm">Network</span>
          <select 
            v-model="toChain"
            class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:border-blue-primary focus:outline-none"
          >
            <option 
              v-for="chain in availableTargetChains" 
              :key="chain" 
              :value="chain"
            >
              {{ getChainDisplayName(chain) }}
            </option>
          </select>
        </div>
        
        <!-- To Fee Rate -->
        <div class="mt-4">
          <FeeRateSelector 
            v-if="toChain === 'btc'" 
            v-model:currentRateFee="toFeeRate" 
          />
          <DOGEFeeRateSelector 
            v-else-if="toChain === 'doge'" 
            v-model:currentRateFee="toFeeRate" 
          />
          <MVCFeeRateSelector 
            v-else-if="toChain === 'mvc'" 
            v-model:currentMVCRateFee="toFeeRate" 
          />
          <!-- To Chain Balance -->
          <div class="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>Balance</span>
            <span>{{ prettifyBalanceFixed(toChainTokenBalance, asset?.symbol || '', asset?.decimal || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Teleport 按钮 -->
    <Button
      type="primary"
      @click="openConfirmModal"
      :disabled="btnDisabled"
      :class="[
        { 'opacity-50 cursor-not-allowed': btnDisabled },
        'w-full h-12 mt-4 flex-shrink-0',
      ]"
    >
      <div class="flex items-center gap-2" v-if="operationLock">
        <LoadingIcon />
        <span>Loading...</span>
      </div>
      <span v-else>Teleport</span>
    </Button>

    <!-- 确认弹窗 -->
    <TeleportConfirmModal
      v-model:open="isConfirmModalOpen"
      :asset="asset"
      :amount="amount"
      :from-chain="fromChain"
      :to-chain="toChain"
      :from-fee-rate="fromFeeRate"
      :to-fee-rate="toFeeRate"
      :estimated-fee="estimatedFee"
      :loading="operationLock"
      @confirm="executeTeleport"
    />
  </FlexBox>
  
  <LoadingText text="Loading..." v-else />
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
