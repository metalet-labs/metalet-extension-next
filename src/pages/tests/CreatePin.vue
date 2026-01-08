<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">CreatePin Test</h1>
      
      <!-- Chain Selector -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Chain</label>
        <div class="flex gap-4">
          <button
            v-for="chain in (['btc', 'doge', 'mvc'] as const)"
            :key="chain"
            @click="selectedChain = chain as 'btc' | 'doge' | 'mvc'"
            :class="[
              'px-4 py-2 rounded-md font-medium transition-colors',
              selectedChain === chain
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            {{ chain.toUpperCase() }}
          </button>
        </div>
      </div>

      <!-- Test Cases -->
      <div class="space-y-4">
        <!-- Case 1: Simple Text PIN -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">1. Simple Text PIN</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Create a single text-based PIN</p>
          <button @click="testSimplePin" :disabled="loading" class="btn-primary">
            {{ loading ? 'Processing...' : 'Test' }}
          </button>
        </div>

        <!-- Case 2: Image PIN -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">2. Image Upload</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Upload an image file as PIN</p>
          <input type="file" @change="handleFileSelect" accept="image/*" class="mb-3" />
          <button @click="testImagePin" :disabled="loading || !selectedFile" class="btn-primary">
            {{ loading ? 'Processing...' : 'Test' }}
          </button>
        </div>

        <!-- Case 3: Batch PINs -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">3. Batch PINs</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Create multiple PINs in one transaction</p>
          <button @click="testBatchPins" :disabled="loading" class="btn-primary">
            {{ loading ? 'Processing...' : 'Test' }}
          </button>
        </div>

        <!-- Case 4: PIN with Service Fee -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">4. PIN with Service Fee</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Create PIN with custom service fee output</p>
          <input 
            v-model="serviceAddress" 
            placeholder="Service Address" 
            class="input mb-2 w-full"
          />
          <input 
            v-model.number="serviceSatoshis" 
            type="number" 
            placeholder="Satoshis (e.g. 10000)" 
            class="input mb-3 w-full"
          />
          <button @click="testServiceFee" :disabled="loading || !serviceAddress" class="btn-primary">
            {{ loading ? 'Processing...' : 'Test' }}
          </button>
        </div>

        <!-- Case 5: Image + Buzz with Refs -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">5. Image + Buzz (with refs)</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Upload image, then post buzz referencing it</p>
          <input type="file" @change="handleFileSelect" accept="image/*" class="mb-3" />
          <textarea 
            v-model="buzzContent" 
            placeholder="Buzz content (use {{image}} for image reference)" 
            class="input mb-3 w-full h-24"
          />
          <button @click="testImageBuzz" :disabled="loading || !selectedFile || !buzzContent" class="btn-primary">
            {{ loading ? 'Processing...' : 'Test' }}
          </button>
        </div>

        <!-- Case 6: Test noBroadcast -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">6. Preview (noBroadcast)</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Create PIN without broadcasting (get raw tx)</p>
          <button @click="testNoBroadcast" :disabled="loading" class="btn-primary">
            {{ loading ? 'Processing...' : 'Test' }}
          </button>
        </div>
      </div>

      <!-- Results Display -->
      <div v-if="result" class="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Result</h2>
          <button @click="result = null" class="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
        <div class="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-auto max-h-96">
          <pre class="text-xs text-gray-800 dark:text-gray-200">{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-6 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 shadow">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold text-red-800 dark:text-red-200">Error</h2>
          <button @click="error = null" class="text-sm text-red-600 hover:text-red-800">Clear</button>
        </div>
        <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedChain = ref<'btc' | 'doge' | 'mvc'>('btc')
const loading = ref(false)
const result = ref<any>(null)
const error = ref<string | null>(null)

const selectedFile = ref<File | null>(null)
const serviceAddress = ref('')
const serviceSatoshis = ref(10000)
const buzzContent = ref('Check out this image! {{image}}')

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callCreatePin(params: any) {
  loading.value = true
  error.value = null
  result.value = null
  
  try {
    // @ts-ignore
    const res = await window.metaidwallet.createPin(params)
    result.value = res
  } catch (err: any) {
    error.value = err.message || String(err)
  } finally {
    loading.value = false
  }
}

// Test Case 1: Simple Text PIN
async function testSimplePin() {
  await callCreatePin({
    chain: selectedChain.value,
    dataList: [
      {
        metaidData: {
          operation: 'create',
          path: '/test/simple',
          body: 'Hello, MetaID! This is a test PIN.',
          contentType: 'text/plain',
        }
      }
    ],
    feeRate: 1
  })
}

// Test Case 2: Image Upload
async function testImagePin() {
  if (!selectedFile.value) return
  
  const base64 = await fileToBase64(selectedFile.value)
  
  await callCreatePin({
    chain: selectedChain.value,
    dataList: [
      {
        metaidData: {
          operation: 'create',
          path: '/test/image',
          body: base64,
          contentType: selectedFile.value.type,
          encoding: 'base64',
        }
      }
    ],
    feeRate: 1
  })
}

// Test Case 3: Batch PINs
async function testBatchPins() {
  await callCreatePin({
    chain: selectedChain.value,
    dataList: [
      {
        metaidData: {
          operation: 'create',
          path: '/test/batch1',
          body: 'First PIN in batch',
          contentType: 'text/plain',
        }
      },
      {
        metaidData: {
          operation: 'create',
          path: '/test/batch2',
          body: 'Second PIN in batch',
          contentType: 'text/plain',
        }
      },
      {
        metaidData: {
          operation: 'create',
          path: '/test/batch3',
          body: 'Third PIN in batch',
          contentType: 'text/plain',
        }
      }
    ],
    feeRate: 1
  })
}

// Test Case 4: PIN with Service Fee
async function testServiceFee() {
  if (!serviceAddress.value) return
  
  await callCreatePin({
    chain: selectedChain.value,
    dataList: [
      {
        metaidData: {
          operation: 'create',
          path: '/test/service',
          body: 'PIN with service fee',
          contentType: 'text/plain',
        },
        options: {
          service: {
            address: serviceAddress.value,
            satoshis: String(serviceSatoshis.value),
          }
        }
      }
    ],
    feeRate: 1
  })
}

// Test Case 5: Image + Buzz with Refs
async function testImageBuzz() {
  if (!selectedFile.value || !buzzContent.value) return
  
  const base64 = await fileToBase64(selectedFile.value)
  
  await callCreatePin({
    chain: selectedChain.value,
    dataList: [
      {
        metaidData: {
          operation: 'create',
          path: '/test/image',
          body: base64,
          contentType: selectedFile.value.type,
          encoding: 'base64',
        }
      },
      {
        metaidData: {
          operation: 'create',
          path: '/protocols/simplebuzz',
          body: buzzContent.value,
          contentType: 'text/plain',
        },
        options: {
          refs: {
            '{{image}}': 0  // Reference first PIN (index 0)
          }
        }
      }
    ],
    feeRate: 1
  })
}

// Test Case 6: noBroadcast
async function testNoBroadcast() {
  await callCreatePin({
    chain: selectedChain.value,
    dataList: [
      {
        metaidData: {
          operation: 'create',
          path: '/test/preview',
          body: 'This transaction will not be broadcast',
          contentType: 'text/plain',
        }
      }
    ],
    feeRate: 1,
    noBroadcast: true
  })
}
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors;
}

.input {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
