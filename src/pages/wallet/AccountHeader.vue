<script lang="ts" setup>
import { ref } from 'vue'
import { FlexBox } from '@/components'
import { useRouter } from 'vue-router'
import { getNetwork } from '@/lib/network'
import Avatar from '@/components/Avatar.vue'
import CopyIcon from '@/assets/icons-v3/copy.svg'
import { prettifyAddress } from '@/lib/formatters'
import CloseIcon from '@/assets/icons-v3/close.svg'
import { WalletsStore } from '@/stores/WalletStore'
import { V3Wallet, type V3Account } from '@/lib/types'
import BtcLogo from '@/assets/icons-v3/btc-logo.svg?url'
import SpaceLogo from '@/assets/icons-v3/space.svg?url'
import { useToast } from '@/components/ui/toast/use-toast'
import ServiceMenu from '@/components/headers/ServiceMenu.vue'
import SettingMenu from '@/components/headers/SettingMenu.vue'
import { Chain, BaseWallet } from '@metalet/utxo-wallet-service'
import TriangleDownIcon from '@/assets/icons-v3/triangle-down.svg'
import { getV3CurrentAccount, getV3CurrentWallet } from '@/lib/wallet'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'

const { toast } = useToast()

const network = ref()
const chainWallets = ref()
const isOpen = ref(false)
const router = useRouter()
const wallet = ref<V3Wallet>()
const account = ref<V3Account>()

getNetwork().then((_network) => (network.value = _network))

getV3CurrentWallet().then((_wallet) => {
  wallet.value = _wallet
})

getV3CurrentAccount().then((_account) => {
  account.value = _account
})

WalletsStore.getAccountChainWallets().then((_chainWallets) => {
  chainWallets.value = Object.fromEntries(
    Object.entries(_chainWallets)
      .filter(([key]) => Object.values(Chain).includes(key as Chain))
      .map(([chain, baseWallets]) => [
        chain,
        (baseWallets as BaseWallet[]).map((baseWallet) => ({
          path: baseWallet.getPath(),
          address: baseWallet.getAddress(),
          addressType: baseWallet.getAddressType(),
        })),
      ])
  )
})

const toManageWallets = () => {
  router.push({
    name: 'manage-wallets',
  })
}

const copy = (address: string, addressType: string, type: string) => {
  toast({ title: `${type} ${addressType} Address Copied`, toastType: 'success', description: address })
  navigator.clipboard.writeText(address)
  isOpen.value = false
}
</script>

<template>
  <div class="flex items-center justify-between py-3">
    <FlexBox ai="center" jc="center" :gap="2" class="cursor-pointer" @click="toManageWallets" v-if="account">
      <Avatar :id="account.id" />
      <div class="flex flex-col" v-if="wallet">
        <div class="flex items-center gap-x-2 text-gray-black">
          <span class="text-xs text-gray-primary">{{ wallet.name }}</span>
        </div>
        <div class="flex items-center gap-x-2 text-gray-black">
          <span class="text-sm">{{ account.name }}</span>
          <TriangleDownIcon class="w-2" />
        </div>
      </div>
    </FlexBox>
    <div class="flex items-center gap-x-4">
      <CopyIcon class="cursor-pointer hover:text-blue-primary w-[22px]" @click="isOpen = true" />
      <SettingMenu />
      <ServiceMenu class="cursor-pointer" />
    </div>
  </div>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="bg-white">
      <DrawerHeader>
        <DrawerTitle class="text-center relative">
          <span>Wallet Address</span>
          <DrawerClose>
            <CloseIcon class="absolute right-0 top-0" />
          </DrawerClose>
        </DrawerTitle>
        <DrawerDescription></DrawerDescription>
      </DrawerHeader>
      <FlexBox d="col" ai="center" :gap="2" class="py-4">
        <FlexBox ai="center" :gap="2" v-if="chainWallets.btc" v-for="btcWallet in chainWallets.btc">
          <img :src="BtcLogo" alt="Bitcoin" class="w-8" />
          <div>
            <div class="space-x-2">
              <span>Bitcoin</span>
              <span class="text-xs bg-gray-soft px-2 py-0.5 rounded-sm">{{ btcWallet.addressType }}</span>
            </div>
            <div class="text-xs text-gray-primary w-64">{{ prettifyAddress(btcWallet.address) }}</div>
          </div>
          <CopyIcon
            class="cursor-pointer hover:text-blue-primary w-4.5"
            @click="copy(btcWallet.address, btcWallet.addressType, 'Bitcoin')"
          />
        </FlexBox>
        <FlexBox ai="center" :gap="2" v-if="chainWallets.mvc" v-for="mvcWallet in chainWallets.mvc">
          <img :src="SpaceLogo" alt="Bitcoin" class="w-8" />
          <div>
            <div class="space-x-2">
              <span>Microvisionchain</span>
              <span class="text-xs bg-gray-soft px-2 py-0.5 rounded-sm">{{ mvcWallet.addressType }}</span>
            </div>
            <div class="text-xs text-gray-primary w-64">{{ prettifyAddress(mvcWallet.address) }}</div>
          </div>
          <CopyIcon
            class="cursor-pointer hover:text-blue-primary w-4.5"
            @click="copy(mvcWallet.address, mvcWallet.addressType, 'Microvisionchain')"
          />
        </FlexBox>
      </FlexBox>
    </DrawerContent>
  </Drawer>
</template>

<style scoped lang="css"></style>
