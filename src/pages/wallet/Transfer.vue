<script lang="ts" setup>
import { computed, ref } from 'vue'
import { LoadingText } from '@/components'
import { useRoute, useRouter } from 'vue-router'
import { SymbolTicker } from '@/lib/asset-symbol'
import TickerList from './components/TickerList.vue'
import { useBRC20AssetQuery } from '@/queries/brc20'
import { FlexBox, Divider, Button } from '@/components'

const route = useRoute()
const router = useRouter()

const address = ref<string>(route.params.address as string)
const symbol = ref<SymbolTicker>(route.params.symbol as SymbolTicker)

const { isLoading, data: asset } = useBRC20AssetQuery(address, symbol, {
  enabled: computed(() => !!address.value),
})

const toSendBRC20 = (inscriptionId: string, amount: number) => {
  router.push({
    name: 'sendBRC20',
    params: { address: address.value, symbol: symbol.value, inscriptionId, amount },
  })
}

const toInscribe = () => {
  router.push({ name: 'inscribe', params: { address: address.value, symbol: symbol.value } })
}
</script>

<template>
  <LoadingText :text="`${symbol} Transfer info Loading...`" v-if="isLoading" />
  <FlexBox d="col" class="pt-1" :gap="4" v-else-if="asset">
    <div class="flex flex-col gap-3">
      <div class="text-sm">{{ $t('Common.Amount') }}</div>
      <FlexBox d="col" class="p-4 border border-gary-soft rounded-lg">
        <FlexBox ai="center" jc="between" class="w-full">
          <span class="text-xl">{{ asset.balance.transferableBalance }} {{ symbol }}</span>
          <!-- TODO: select all -->
          <button class="text-xs text-blue-primary cursor-not-allowed" disabled v-if="false">Select All</button>
        </FlexBox>
        <Divider class="border-gray-soft my-4" />
        <FlexBox d="col" :gap="4">
          <span class="text-sm text-slate-light" v-if="asset">
            Transfer Inscriptions ({{ asset.transferableList!.length }})
          </span>
          <!-- TODO: select multiple-->
          <TickerList :loading="isLoading" :list="asset.transferableList" :clickEvent="toSendBRC20" />
        </FlexBox>
      </FlexBox>
    </div>
    <div>
      <div class="text-sm">Inscribe Transfer</div>
      <div class="text-gray-primary text-xs">You have to inscribe a TRANSFER inscription first.</div>
      <div
        @click="toInscribe"
        class="flex items-center justify-center gap-2 bg-gray-secondary text-sm rounded-md h-12 mt-3 cursor-pointer border border-blue-primary bg-[rgba(23, 26, 255, 0.05)]"
      >
        <span class="text-gray-primary">Available</span>
        <span>{{ asset.balance.availableBalance }} {{ symbol }}</span>
      </div>
    </div>
  </FlexBox>
</template>
