<script setup lang="ts">
import { ref } from 'vue'
import NO_NFT_DATA from './NoNFTData.vue'
import MetaIDPinList from './MetaIDPinList.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import { Service, getServiceNetwork } from '@/lib/network'
import { type MetaIDTabType, getMetaIDType, setMetaIdType, metaIds } from '@/lib/metaId'

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
    <MetaIDPinList v-if="metaIDType === 'MetaID PIN'" />
    <NO_NFT_DATA v-else />
  </div>
</template>

<style scoped lang="css"></style>
