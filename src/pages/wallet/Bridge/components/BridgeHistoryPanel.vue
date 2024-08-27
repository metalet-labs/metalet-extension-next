<template>
  <div class="no-scrollbar min-h-96 h-96 overflow-y-scroll w-full nicer-scrollbar">
    <Empty v-if="list.length === 0 && !loading">
      <template #description>
        <span class="font-sm mt-1 text-[#37463A]">No Transfers yet</span>
      </template>
    </Empty>

    <div v-for="item in list" :key="item.originTxid" class="bg-panel/70 mt-3 rounded-xl py-5 px-3 w-full">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2">
            <btc class="size-6" v-if="item.originNetwork == 'BTC'" />
            <mvc class="size-6" v-else />
            {{ item.originNetwork }}
          </div>
          <ArrowRight />
          <div class="flex items-center gap-2">
            <mvc class="size-6" v-if="item.targetNetwork == 'MVC'" />
            <btc class="size-6" v-else />
            {{ item.targetNetwork }}
          </div>
        </div>
        <div :style="{ color: item.status === 'success' ? '#8CFF95' : '#F7931A' }">
          {{ item.status === 'doing' ? 'pending' : item.status }}
        </div>
      </div>
      <div class="border-b border-[#EBEBEB]/5 my-2" />
      <div class="flex items-center justify-between">
        <div class="left">
          <span class="info">{{ calcBalance(item.amount, item.decimals, item.symbol) }}</span>
        </div>
        <div class="right">{{ item.timestamp }}</div>
      </div>
    </div>

    <span v-if="loading">loading...</span>
    <div v-if="list.length > 0 && isEnd" class="flex items-center justify-center">no More</div>
    <Button v-if="list.length > 0 && !isEnd" @click="loadMore">load More</Button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { prettyTimestamp } from '@/lib/utils'
import { getBridgeHistory, useBridgeInfoQuery } from '@/queries/bridge'
import Empty from './Empty.vue'
import btc from '@/assets/icons-v3/network_btc.svg'
import mvc from '@/assets/icons-v3/network_mvc.svg'
import { ArrowRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Chain } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { calcBalance } from '@/lib/formatters'

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
})

const size = 10
const { data: AssetsInfo } = useBridgeInfoQuery()
const { getAddress } = useChainWalletsStore()
const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)
const page = ref(0)
const list = ref([])
const isEnd = ref(false)
const loading = ref(false)

const fetchHistory = async () => {
  if (!AssetsInfo) return
  try {
    loading.value = true

    const { txList } = await getBridgeHistory({
      type: props.type,
      cursor: String(page.value * size),
      size: String(size),
      order: 'desc',
      address: props.type.startsWith('mvc') ? mvcAddress.value : btcAddress.value || '',
    })
    if (txList.length < size) {
      isEnd.value = true
    }
    const _list = txList.map((item) => {
      if (
        props.type === 'btcToMvc' ||
        props.type === 'brc20ToMvc' ||
        props.type === 'runesToMvc' ||
        props.type === 'mrc20ToMvc'
      ) {
        item.originNetwork = 'BTC'
        item.targetNetwork = 'MVC'
      }
      if (
        props.type === 'mvcToBtc' ||
        props.type === 'mvcToBrc20' ||
        props.type === 'mvcToRunes' ||
        props.type === 'mvcToMrc20'
      ) {
        item.originNetwork = 'MVC'
        item.targetNetwork = 'BTC'
      }
      item.timestamp = prettyTimestamp(Number(item.timestamp), true)
      return item
    })
    list.value = [...list.value, ..._list]
  } catch (err) {
    console.log(err)
  }
  loading.value = false
}

const loadMore = () => {
  page.value += 1
  fetchHistory()
}

onMounted(fetchHistory)
</script>
