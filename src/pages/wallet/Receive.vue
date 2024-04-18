<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { type Chain } from '@/lib/types'
import { allAssets } from '@/data/assets'
import { toast } from '@/components/ui/toast'
import { prettifyTxId } from '@/lib/formatters'
import CopyIcon from '@/assets/icons-v3/copy.svg'
import { useQRCode } from '@vueuse/integrations/useQRCode'

const route = useRoute()
const chain = ref(route.query.chain as Chain)
const address = ref(route.params.address as string)
const qrcode = useQRCode(address.value)
const asset = computed(() => allAssets.find((asset) => asset.chain === chain.value))
</script>

<template>
  <div class="mt-8 flex flex-col items-center justify-center gap-y-3">
    <img :src="asset!.logo" alt="" class="h-16 w-16 rounded-xl" />

    <!-- qrcode -->
    <div class="mt-2 h-40 w-40 overflow-hidden rounded-xl bg-white p-2 shadow-inner shadow-gray-200">
      <img :src="qrcode" alt="Address QR Code" class="h-full w-full rounded-inherit" />
    </div>

    <div class="mt-3 flex px-3 py-3.5 items-center justify-between w-[232px] gap-4 border border-gray-soft rounded-lg">
      <div class="truncate flex-1">{{ prettifyTxId(address) }}</div>
      <CopyIcon
        :text="address"
        class="cursor-pointer hover:text-blue-primary w-[22px]"
        @click="
          toast({ title: `${chain.toLocaleUpperCase()}  Address Copied`, toastType: 'success', description: address })
        "
      />
    </div>
  </div>
</template>
