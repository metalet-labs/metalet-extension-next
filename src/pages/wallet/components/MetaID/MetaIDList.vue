<script setup lang="ts">
import { ref } from 'vue'
import NO_NFT_DATA from './NoNFTData.vue'
import MetaIDPinList from './MetaIDPinList.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { Service, getServiceNetwork } from '@/lib/network'
import { type MetaIDTabType, getMetaIDType, setMetaIdType, metaIds } from '@/lib/metaId'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const metaIDType = ref<MetaIDTabType>()
const service = ref<Service>(Object.values(Chain))

getMetaIDType().then((_metaIDType) => {
  metaIDType.value = _metaIDType
})

getServiceNetwork().then((_service) => {
  service.value = _service
  if (_service.length === Object.values(Chain).length) {
    return
  }
  const metaId = metaIds.find((metaId) => metaId.name === metaIDType.value)
  if (metaId && !_service.includes(metaId.chain)) {
    const _metaId = metaIds.find((_metaId) => _metaId.chain === _service[0])
    if (_metaId) {
      metaIDTypeOnchange(_metaId.name as MetaIDTabType)
    }
  }
})

const metaIDTypeOnchange = (_metaId: MetaIDTabType) => {
  metaIDType.value = _metaId
  setMetaIdType(_metaId)
}
</script>

<template>
  <div class="w-full">
    <div class="py-3 text-sm cursor-pointer -mx-4 bg-gray-light px-4">
      <DropdownMenu>
        <DropdownMenuTrigger class="flex items-center gap-x-2">
          <span>{{ metaIDType }}</span>
          <SelectorIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="bg-white">
          <DropdownMenuItem @select="metaIDTypeOnchange('MetaID PIN')" v-if="service.includes(Chain.BTC)">
            MetaID PIN
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <MetaIDPinList v-if="metaIDType === 'MetaID PIN'" />
    <NO_NFT_DATA v-else />
  </div>
</template>

<style scoped lang="css"></style>
