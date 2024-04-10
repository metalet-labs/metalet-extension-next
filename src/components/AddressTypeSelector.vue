<script setup lang="ts">
import { ref } from 'vue'
import { WalletsStore } from '@/stores/WalletStore'
import { Chain, AddressType } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { setV3AddressTypeStorage, getV3AddressTypeStorage } from '@/lib/addressType'

const { updataWallet } = useChainWalletsStore()

const { chain } = defineProps<{
  chain: Chain
}>()

const types = ref<AddressType[]>([])

const currentType = ref<AddressType>()

WalletsStore.getAccountChainWallets().then((chainWallets) => {
  types.value = chainWallets[chain]!.map((wallet) => wallet.getAddressType())
})

const setAddressType = async (addressType: AddressType) => {
  currentType.value = addressType
  await setV3AddressTypeStorage(chain, addressType)
  updataWallet(chain)
}

getV3AddressTypeStorage(chain).then((addressType) => {
  currentType.value = addressType
})
</script>

<template>
  <div class="flex items-center gap-2 text-xs flex-wrap">
    <span
      :key="type"
      v-for="type in types"
      @click="setAddressType(type)"
      :class="[
        { 'bg-gray-light text-blue-primary': currentType === type },
        'hover:text-blue-primary hover:bg-gray-light px-2 py-1 rounded cursor-pointer',
      ]"
    >
      {{ type }}
    </span>
  </div>
</template>

<style scoped lang="css"></style>
