<script setup lang="ts">
import { ref } from 'vue'
import NO_NFT_DATA from './NoNFTData.vue'
import MetaIDPinList from './MetaIDPinList.vue'
import InscriptionList from './InscriptionList.vue'
import MetaContractList from './MetaContractList.vue'
import SelectorIcon from '@/assets/icons-v3/selector.svg'
import { Service, getServiceNetwork } from '@/lib/network'
import { type NFTType, getNftType, setNftType, nfts } from '@/lib/nft'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const nftType = ref<NFTType>()
const service = ref<Service>('all')

getNftType().then((_nftType) => {
  nftType.value = _nftType
})

getServiceNetwork().then((_service) => {
  service.value = _service
  if (_service === 'all') {
    return
  }
  const nft = nfts.find((nft) => nft.name === nftType.value)
  if (nft && nft.chain !== _service) {
    const nft = nfts.find((nft) => nft.chain === _service)
    if (nft) {
      nftTypeOnchange(nft.name as NFTType)
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
          <DropdownMenuItem @select="nftTypeOnchange('BTC Oridinals')" v-if="service !== 'mvc'">
            BTC Oridinals
          </DropdownMenuItem>
          <DropdownMenuItem @select="nftTypeOnchange('MetaContract')" v-if="service !== 'btc'">
            MetaContract
          </DropdownMenuItem>
          <DropdownMenuItem @select="nftTypeOnchange('MetaID PIN')" v-if="service !== 'mvc'">
            MetaID PIN
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <InscriptionList v-if="nftType === 'BTC Oridinals'" />
    <MetaContractList v-else-if="nftType === 'MetaContract'" />
    <MetaIDPinList v-else-if="nftType === 'MetaID PIN'" />
    <NO_NFT_DATA v-else />
  </div>
</template>

<style scoped lang="css"></style>
