<script setup lang="ts">
import { ref, computed } from 'vue'
import { getPassword } from '@/lib/lock'
import { process as dogeInscribe, type MetaidData, type Operation } from '@/lib/actions/doge/inscribe'
import { getDogeWallet } from '@/lib/actions/doge/wallet'
import { fetchDogeUtxos } from '@/queries/doge/utxos'
import { getDefaultDogeFeeRates } from '@/queries/doge/transaction'

// 表单数据
const operation = ref<Operation>('create')
const contentType = ref('text/plain')
const encryption = ref<'0' | '1' | '2'>('0')
const version = ref('1.0.0')
const path = ref('')
const body = ref('Hello DOGE MetaID!')
const revealAddr = ref('')
const feeRateInput = ref(500000) // 默认 500000 sat/KB
const noBroadcast = ref(true) // 默认不广播，先看看生成的交易

// 状态
const loading = ref(false)
const error = ref('')
const result = ref<any>(null)
const walletInfo = ref<any>(null)
const utxoInfo = ref<any>(null)

// 费率选项
const feeRates = getDefaultDogeFeeRates()

// 初始化钱包信息
const initWalletInfo = async () => {
  try {
    const wallet = await getDogeWallet()
    const address = wallet.getAddress()
    revealAddr.value = address
    
    walletInfo.value = {
      address,
      publicKey: wallet.getPublicKeyHex(),
    }

    // 获取 UTXO
    const utxos = await fetchDogeUtxos(address, false)
    utxoInfo.value = {
      count: utxos.length,
      total: utxos.reduce((sum, u) => sum + u.satoshis, 0),
      utxos: utxos.slice(0, 5), // 只显示前5个
    }
  } catch (e: any) {
    error.value = '获取钱包信息失败: ' + e.message
  }
}

// 执行 inscribe
const handleInscribe = async () => {
  loading.value = true
  error.value = ''
  result.value = null

  try {
    const metaidData: MetaidData = {
      operation: operation.value,
      contentType: contentType.value,
      encryption: encryption.value,
      version: version.value,
      path: path.value,
      body: body.value,
      revealAddr: revealAddr.value,
    }

    console.log('MetaID Data:', metaidData)
    console.log('Fee Rate:', feeRateInput.value, 'sat/KB')
    console.log('No Broadcast:', noBroadcast.value)

    const res = await dogeInscribe({
      data: {
        feeRate: feeRateInput.value,
        metaidDataList: [metaidData],
      },
      options: {
        noBroadcast: noBroadcast.value,
      },
    })

    result.value = res
    console.log('Inscribe Result:', res)
  } catch (e: any) {
    console.error('Inscribe Error:', e)
    error.value = e.message || 'Unknown error'
  } finally {
    loading.value = false
  }
}

// 格式化 satoshis 为 DOGE
const formatDoge = (satoshis: number) => {
  return (satoshis / 100000000).toFixed(8) + ' DOGE'
}

// 页面加载时初始化
initWalletInfo()
</script>

<template>
  <div class="w-full min-h-screen bg-gray-100 py-4 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6 text-center">DOGE Inscribe 测试</h1>

      <!-- 钱包信息 -->
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <h2 class="text-lg font-semibold mb-2">钱包信息</h2>
        <div v-if="walletInfo" class="text-sm">
          <p><strong>地址:</strong> {{ walletInfo.address }}</p>
          <p class="break-all"><strong>公钥:</strong> {{ walletInfo.publicKey }}</p>
        </div>
        <div v-else class="text-gray-500">加载中...</div>
      </div>

      <!-- UTXO 信息 -->
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <h2 class="text-lg font-semibold mb-2">UTXO 信息</h2>
        <div v-if="utxoInfo" class="text-sm">
          <p><strong>UTXO 数量:</strong> {{ utxoInfo.count }}</p>
          <p><strong>总余额:</strong> {{ formatDoge(utxoInfo.total) }}</p>
          <div v-if="utxoInfo.utxos.length > 0" class="mt-2">
            <p class="font-medium">前 {{ utxoInfo.utxos.length }} 个 UTXO:</p>
            <ul class="list-disc list-inside text-xs">
              <li v-for="(utxo, idx) in utxoInfo.utxos" :key="idx">
                {{ utxo.txId.slice(0, 8) }}...{{ utxo.txId.slice(-8) }}:{{ utxo.outputIndex }} 
                - {{ formatDoge(utxo.satoshis) }}
              </li>
            </ul>
          </div>
        </div>
        <div v-else class="text-gray-500">加载中...</div>
      </div>

      <!-- 表单 -->
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <h2 class="text-lg font-semibold mb-4">铭刻参数</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Operation -->
          <div>
            <label class="block text-sm font-medium mb-1">Operation</label>
            <select v-model="operation" class="w-full border rounded p-2">
              <option value="init">init</option>
              <option value="create">create</option>
              <option value="modify">modify</option>
              <option value="revoke">revoke</option>
            </select>
          </div>

          <!-- Content Type -->
          <div>
            <label class="block text-sm font-medium mb-1">Content Type</label>
            <input v-model="contentType" type="text" class="w-full border rounded p-2" />
          </div>

          <!-- Encryption -->
          <div>
            <label class="block text-sm font-medium mb-1">Encryption</label>
            <select v-model="encryption" class="w-full border rounded p-2">
              <option value="0">0 - 不加密</option>
              <option value="1">1 - 加密</option>
              <option value="2">2 - ECIES</option>
            </select>
          </div>

          <!-- Version -->
          <div>
            <label class="block text-sm font-medium mb-1">Version</label>
            <input v-model="version" type="text" class="w-full border rounded p-2" />
          </div>

          <!-- Path -->
          <div>
            <label class="block text-sm font-medium mb-1">Path</label>
            <input v-model="path" type="text" class="w-full border rounded p-2" placeholder="可选" />
          </div>

          <!-- Reveal Address -->
          <div>
            <label class="block text-sm font-medium mb-1">Reveal Address</label>
            <input v-model="revealAddr" type="text" class="w-full border rounded p-2" />
          </div>

          <!-- Fee Rate -->
          <div>
            <label class="block text-sm font-medium mb-1">Fee Rate (sat/KB)</label>
            <input v-model.number="feeRateInput" type="number" class="w-full border rounded p-2" />
            <div class="text-xs text-gray-500 mt-1">
              预设: 
              <span v-for="rate in feeRates" :key="rate.title" 
                    class="cursor-pointer text-blue-500 mr-2"
                    @click="feeRateInput = rate.feeRate">
                {{ rate.title }}({{ rate.feeRate }})
              </span>
            </div>
          </div>

          <!-- No Broadcast -->
          <div class="flex items-center">
            <label class="flex items-center cursor-pointer">
              <input v-model="noBroadcast" type="checkbox" class="mr-2" />
              <span class="text-sm font-medium">不广播 (仅生成交易)</span>
            </label>
          </div>
        </div>

        <!-- Body -->
        <div class="mt-4">
          <label class="block text-sm font-medium mb-1">Body (铭刻内容)</label>
          <textarea v-model="body" rows="4" class="w-full border rounded p-2" placeholder="输入要铭刻的内容"></textarea>
        </div>

        <!-- Submit Button -->
        <div class="mt-4">
          <button 
            @click="handleInscribe"
            :disabled="loading || !walletInfo"
            class="w-full bg-blue-500 text-white py-2 px-4 rounded font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {{ loading ? '处理中...' : (noBroadcast ? '生成交易' : '铭刻并广播') }}
          </button>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>错误:</strong> {{ error }}
      </div>

      <!-- 结果 -->
      <div v-if="result" class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-2">结果</h2>
        
        <!-- 广播结果 -->
        <div v-if="result.commitTxId" class="text-sm">
          <p><strong>Commit TxId:</strong></p>
          <p class="break-all text-xs bg-gray-100 p-2 rounded mb-2">{{ result.commitTxId }}</p>
          
          <p><strong>Reveal TxIds:</strong></p>
          <p v-for="(txId, idx) in result.revealTxIds" :key="idx" class="break-all text-xs bg-gray-100 p-2 rounded mb-1">
            {{ txId }}
          </p>
        </div>

        <!-- Hex 结果 -->
        <div v-if="result.commitTxHex" class="text-sm">
          <p><strong>Commit Tx Hex:</strong></p>
          <textarea readonly :value="result.commitTxHex" rows="3" class="w-full text-xs bg-gray-100 p-2 rounded mb-2 font-mono"></textarea>
          
          <p><strong>Reveal Txs Hex:</strong></p>
          <textarea v-for="(hex, idx) in result.revealTxsHex" :key="idx" 
                    readonly :value="hex" rows="3" 
                    class="w-full text-xs bg-gray-100 p-2 rounded mb-1 font-mono"></textarea>
        </div>

        <!-- 费用信息 -->
        <div class="mt-4 text-sm">
          <p><strong>Commit 费用:</strong> {{ formatDoge(result.commitCost) }}</p>
          <p><strong>Reveal 费用:</strong> {{ formatDoge(result.revealCost) }}</p>
          <p><strong>总费用:</strong> {{ formatDoge(result.totalCost) }}</p>
        </div>

        <!-- 原始 JSON -->
        <div class="mt-4">
          <p class="text-sm font-medium mb-1">原始结果 (JSON):</p>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义样式 */
</style>
