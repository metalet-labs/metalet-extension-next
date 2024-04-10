<script lang="ts" setup>
import type { Asset } from '@/data/assets'
import { Divider, Copy } from '@/components'
import { prettifyTxId } from '@/lib/formatters'
import AssetLogo from '@/components/AssetLogo.vue'
import CloseIcon from '@/assets/icons-v3/close.svg'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'

const { asset, qrcode, address, open } = defineProps<{
  asset: Asset
  open: boolean
  qrcode: string
  address: string
}>()

const emit = defineEmits(['update:open'])
</script>

<template>
  <Teleport to="main" v-if="open">
    <div class="flex flex-col w-full h-full absolute top-0 left-0 bg-gray-secondary">
      <div class="w-full h-15 flex items-center justify-between px-4">
        <ArrowLeftIcon class="w-3.5 cursor-pointer" @click="emit('update:open', false)" />
        <CloseIcon class="w-3.5 cursor-pointer" @click="emit('update:open', false)" />
      </div>
      <div class="p-4 grow">
        <div class="w-full h-full rounded-xl bg-white flex flex-col items-center py-6">
          <AssetLogo :chain="asset.chain" type="network" :symbol="asset.symbol" :logo="asset.logo" class="w-15" />
          <div class="mt-3 font-medium">{{ asset.symbol }}</div>
          <div class="text-gray-primary text-xs">
            Only supports receiving
            <span v-if="asset.chain === 'mvc'">Microvisionchain</span>
            <span v-else-if="asset.chain === 'btc'">Bitcoin</span>
            network assets
          </div>
          <Divider class="w-[232px] my-4" />
          <img :src="qrcode" alt="" class="w-[232px] h-[232px] rounded-lg" />
          <div
            class="mt-3 flex px-3 py-3.5 items-center justify-between w-[232px] gap-4 border border-gray-soft rounded-lg"
          >
            <div class="truncate flex-1">{{ prettifyTxId(address) }}</div>
            <Copy :text="address" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
