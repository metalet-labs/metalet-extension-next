<script setup lang="ts">
import { ref } from 'vue'
import NO_NFT_DATA from './NoNFTData.vue'
import InscriptionList from './InscriptionList.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import MetaContractList from './MetaContractList.vue'
import MetaIDPinList from '../MetaID/MetaIDPinList.vue'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { Service, getServiceNetwork } from '@/lib/network'
import { type NFTType, getNftType, setNftType, nfts } from '@/lib/nft'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const nftType = ref<NFTType>()
const service = ref<Service>(Object.values(Chain))

getNftType().then((_nftType) => {
  nftType.value = _nftType
})

getServiceNetwork().then((_service) => {
  service.value = _service
  if (_service.length === Object.values(Chain).length) {
    return
  }
  const nft = nfts.find((nft) => nft.name === nftType.value)
  if (nft && !_service.includes(nft.chain)) {
    const _nft = nfts.find((_nft) => _nft.chain === _service[0])
    if (_nft) {
      nftTypeOnchange(_nft.name as NFTType)
    }
  }
})

const nftTypeOnchange = (_nftType: NFTType) => {
  nftType.value = _nftType
  setNftType(_nftType)
}
</script>

<template>
  <div class="w-full">
    <div class="py-3 text-sm cursor-pointer -mx-4 bg-gray-light px-4">
      <DropdownMenu>
        <DropdownMenuTrigger class="flex items-center gap-x-2">
          <span>{{ nftType }}</span>
          <SelectorIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="bg-white">
          <DropdownMenuItem @select="nftTypeOnchange('Ordinals')" v-if="service.includes(Chain.BTC)">
            Ordinals
          </DropdownMenuItem>
          <DropdownMenuItem @select="nftTypeOnchange('MetaContract')" v-if="service.includes(Chain.MVC)">
            MetaContract
          </DropdownMenuItem>
          <DropdownMenuItem @select="nftTypeOnchange('MetaID PIN')">
            MetaID PIN
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <InscriptionList v-if="nftType === 'Ordinals'" />
    <MetaContractList v-else-if="nftType === 'MetaContract'" />
    <MetaIDPinList v-else-if="nftType === 'MetaID PIN'" />
    <NO_NFT_DATA v-else />
  </div>
</template>

<style scoped lang="css"></style>
