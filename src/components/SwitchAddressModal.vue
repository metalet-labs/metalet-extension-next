<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Asset } from '@/data/assets'
import { useRouter } from 'vue-router'
import { SymbolTicker } from '@/lib/asset-symbol'
import { prettifyAddress } from '@/lib/formatters'
import CloseIcon from '@/assets/icons-v3/close.svg'
import { WalletsStore } from '@/stores/WalletStore'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'
import { setV3AddressTypeStorage } from '@/lib/addressType'
import { AddressType, Chain } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import SuccessCheckedIcon from '@/assets/icons-v3/success-checked.svg'

const props = defineProps<{
  show: boolean
  asset: Asset
}>()

const router = useRouter()

const { getIcon } = useIconsStore()
const logo = computed(() => getIcon(CoinCategory.Native, props.asset.symbol as SymbolTicker) || '')

const { updataWallet, getAddress } = useChainWalletsStore()

const address = getAddress(props.asset.chain as Chain)

const emit = defineEmits(['update:show'])

const setAddressType = async (addressType: AddressType, _address: string) => {
  const chain = props.asset.chain as Chain
  await setV3AddressTypeStorage(chain, addressType)
  await updataWallet(chain)
  close()
  router.replace(`/wallet/asset/${props.asset.symbol}/${_address}`)
}

const chainWallets = ref()
WalletsStore.getAccountChainWallets().then((_chainWallets) => {
  chainWallets.value = _chainWallets[props.asset.chain]!.map((wallet) => ({
    address: wallet.getAddress(),
    addressType: wallet.getAddressType(),
  }))
})

const modalState = ref<'open' | 'closed'>('open')

const close = () => {
  modalState.value = 'closed'
  const timeId = setTimeout(() => {
    clearTimeout(timeId)
    emit('update:show', false)
    modalState.value = 'open'
  }, 150)
}
</script>

<template>
  <Teleport to="main" v-if="show">
    <div class="absolute inset-0 isolate z-50 flex items-end bg-black/20 backdrop-blur-sm flex-col overflow-hidden">
      <div class="grow w-full" @click="close"></div>
      <div
        :data-state="modalState"
        class="w-full bg-white rounded-t-xl data-[state=open]:animate-drawer-up data-[state=closed]:animate-drawer-down"
      >
        <div class="py-3.5 h-12 relative text-center">
          <span>Set Default Address</span>
          <CloseIcon @click="close" class="absolute top-1/2 -translate-y-1/2 right-[18px] cursor-pointer" />
        </div>
        <div class="flex flex-col items-center">
          <div
            v-for="wallet in chainWallets"
            class="h-15 w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div class="flex items-center gap-3 w-full" @click="setAddressType(wallet.addressType, wallet.address)">
              <img :src="logo" alt="" class="w-9" />
              <div class="space-y-1">
                <div class="text-sm" :title="wallet.address">
                  {{ prettifyAddress(wallet.address) }}
                </div>
                <div class="text-xs text-gray-primary">{{ wallet.addressType }}</div>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1.5">
              <SuccessCheckedIcon v-show="wallet.address === address" class="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="css">
.reset-button {
  @apply rounded-lg border-2 py-3 text-sm;
}
</style>
