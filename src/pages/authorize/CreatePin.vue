<template>
  <div class="space-y-4">
    <div class="rounded-md bg-gray-50 p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Chain</span>
        <span class="text-sm font-bold text-gray-900">{{ params.chain?.toUpperCase() }}</span>
      </div>
      
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">PINs to Create</span>
        <span class="text-sm font-bold text-gray-900">{{ params.dataList?.length || 0 }}</span>
      </div>
      
      <div v-if="params.feeRate" class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Fee Rate</span>
        <span class="text-sm font-bold text-gray-900">{{ formatFeeRate(params.feeRate) }}</span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">Broadcast</span>
        <span 
          class="text-sm font-bold px-2 py-0.5 rounded"
          :class="params.noBroadcast ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'"
        >
          {{ params.noBroadcast ? 'Preview Only' : 'Yes' }}
        </span>
      </div>
    </div>

    <div class="space-y-2">
      <div 
        v-for="(detail, index) in params.dataList" 
        :key="index"
        class="rounded-md border border-gray-200 p-3"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-gray-500">PIN #{{ index + 1 }}</span>
          <span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
            {{ detail.metaidData.operation }}
          </span>
        </div>
        
        <div class="text-sm space-y-1">
          <div v-if="detail.metaidData.path" class="flex flex-col">
            <span class="text-gray-600 mb-1">Path:</span>
            <span class="font-mono text-xs break-all bg-gray-100 text-gray-800 p-1 rounded">{{ detail.metaidData.path }}</span>
          </div>
          
          <div v-if="detail.metaidData.contentType" class="flex justify-between">
            <span class="text-gray-600">Type:</span>
            <span class="text-xs text-gray-800">{{ detail.metaidData.contentType }}</span>
          </div>
          
          <div v-if="detail.metaidData.body" class="flex justify-between">
            <span class="text-gray-600">Size:</span>
            <span class="text-xs text-gray-800">{{ getBodySize(detail.metaidData.body) }}</span>
          </div>

          <div v-if="detail.metaidData.body" class="flex flex-col">
            <span class="text-gray-600 mb-1">Content:</span>
            <div class="font-mono text-xs bg-gray-100 text-gray-800 p-2 rounded max-h-24 overflow-y-auto break-all">
              {{ getBodyPreview(detail.metaidData.body, detail.metaidData.encoding) }}
            </div>
          </div>

          <div v-if="detail.options?.service" class="flex justify-between text-orange-600">
            <span>Service Fee:</span>
            <span class="font-mono text-xs">{{ detail.options.service.satoshis }} sats</span>
          </div>

          <div v-if="detail.options?.outputs?.length" class="flex justify-between text-purple-600">
            <span>Extra Outputs:</span>
            <span class="text-xs">{{ detail.options.outputs.length }} outputs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center gap-x-2 py-4">
      <LoadingIcon />
      <span class="text-sm text-gray-500">Estimating cost...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <p class="text-sm text-red-800">{{ error.message }}</p>
    </div>

    <!-- Cost Breakdown -->
    <div v-else class="space-y-3">
      <!-- BTC/DOGE: Commit + Reveal -->
      <div v-if="params.chain !== 'mvc' && (commitCost > 0 || revealCost > 0)" class="rounded-md bg-blue-50 p-4 space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Commit Cost</span>
          <div class="text-right">
            <div class="font-medium text-gray-900">{{ formatSatoshis(commitCost) }}</div>
            <div class="text-xs text-gray-500">{{ formatCoin(commitCost) }}</div>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Reveal Cost</span>
          <div class="text-right">
            <div class="font-medium text-gray-900">{{ formatSatoshis(revealCost) }}</div>
            <div class="text-xs text-gray-500">{{ formatCoin(revealCost) }}</div>
          </div>
        </div>
      </div>

      <!-- Service Fee -->
      <div v-if="serviceCost > 0" class="rounded-md bg-orange-50 p-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-orange-700">Service Fee</span>
          <div class="text-right">
            <div class="font-medium text-orange-900">{{ formatSatoshis(serviceCost) }}</div>
            <div class="text-xs text-orange-600">{{ formatCoin(serviceCost) }}</div>
          </div>
        </div>
      </div>

      <!-- Total Cost -->
      <div class="rounded-md bg-green-50 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-green-700">Total Cost</span>
          <div class="text-right">
            <div class="text-lg font-bold text-green-900">{{ formatSatoshis(totalCost + serviceCost) }}</div>
            <div class="text-xs text-green-600">{{ formatCoin(totalCost + serviceCost) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import actions from '@/data/authorize-actions'
import LoadingIcon from '@/components/LoadingIcon.vue'

const props = defineProps<{
  params: {
    chain: 'btc' | 'mvc' | 'doge'
    dataList: Array<{
      metaidData: {
        operation: string
        path?: string
        body?: string | Buffer
        contentType?: string
        encoding?: string
      }
      options?: {
        service?: {
          address: string
          satoshis: string
        }
        outputs?: Array<{
          address: string
          satoshis: string
        }>
      }
    }>
    feeRate?: number
    noBroadcast?: boolean
  }
}>()

const loading = ref(true)
const error = ref<Error>()
const totalCost = ref<number>(0)
const commitCost = ref<number>(0)
const revealCost = ref<number>(0)
const serviceCost = ref<number>(0)

// 计算服务费总和
serviceCost.value = props.params.dataList.reduce((sum, detail) => {
  return sum + Number(detail.options?.service?.satoshis || 0)
}, 0)

// 调用 process 获取费用估算
actions.CreatePin.process({ ...props.params, noBroadcast: true })
  .then((result: any) => {
    if (result.commitCost !== undefined) {
      // BTC/DOGE 返回结构
      commitCost.value = result.commitCost
      revealCost.value = result.revealCost
      totalCost.value = result.totalCost
    } else if (result.totalCost !== undefined) {
      // MVC 返回结构
      totalCost.value = result.totalCost
    }
  })
  .catch((err: Error) => {
    error.value = err
    console.error('Failed to estimate cost:', err)
  })
  .finally(() => {
    loading.value = false
  })

function getBodySize(body: string | Buffer | undefined): string {
  if (!body) return '0 B'
  
  const size = typeof body === 'string' ? body.length : body.length
  
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

function formatCoin(satoshis: number): string {
  const amount = (satoshis / 1e8).toFixed(8)
  switch (props.params.chain) {
    case 'btc':
      return `${amount} BTC`
    case 'mvc':
      return `${amount} SPACE`
    case 'doge':
      return `${amount} DOGE`
    default:
      return `${amount} BTC`
  }
}

function formatSatoshis(satoshis: number): string {
  return satoshis.toLocaleString() + ' sats'
}

function formatFeeRate(feeRate: number): string {
  switch (props.params.chain) {
    case 'btc':
      // BTC: sat/vB
      return `${feeRate} sat/vB`
    case 'doge':
      // DOGE: sat/KB, 转换为 DOGE/KB 显示
      const dogePerKB = feeRate / 1e8
      if (dogePerKB >= 0.001) {
        return `${dogePerKB.toFixed(4)} DOGE/KB`
      }
      return `${feeRate.toLocaleString()} sat/KB`
    case 'mvc':
      // MVC: sat/B
      return `${feeRate} sat/B`
    default:
      return `${feeRate}`
  }
}

function getBodyPreview(body: string | Buffer | undefined, encoding?: string): string {
  if (!body) return '(empty)'
  
  try {
    // 如果是Buffer，尝试转换为字符串
    let content = typeof body === 'string' ? body : body.toString('utf-8')
    
    // 如果是base64编码，显示提示
    if (encoding === 'base64') {
      return '[Base64 encoded data, ' + getBodySize(body) + ']'
    }
    
    // 尝试解析JSON
    try {
      const parsed = JSON.parse(content)
      content = JSON.stringify(parsed, null, 2)
    } catch {
      // 不是JSON，保持原样
    }
    
    // 截断过长内容
    const maxLength = 200
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + '...'
    }
    
    return content
  } catch (err) {
    return '[Binary data, ' + getBodySize(body) + ']'
  }
}
</script>
