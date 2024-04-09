<script lang="ts" setup>
import { ref } from 'vue'
import { FlexBox } from '@/components'
import { useRouter } from 'vue-router'
import { getNetwork } from '@/lib/network'
import Avatar from '@/components/Avatar.vue'
import { type V3Account } from '@/lib/types'
import CopyIcon from '@/assets/icons-v3/copy.svg'
import { getV3CurrentAccount } from '@/lib/wallet'
import CloseIcon from '@/assets/icons-v3/close.svg'
import { WalletsStore } from '@/stores/WalletStore'
import BtcLogo from '@/assets/images/btc-logo.svg?url'
import SpaceLogo from '@/assets/images/space-logo.svg?url'
import { useToast } from '@/components/ui/toast/use-toast'
import { PencilSquareIcon } from '@heroicons/vue/24/solid'
import ServiceMenu from '@/components/headers/ServiceMenu.vue'
import SettingMenu from '@/components/headers/SettingMenu.vue'
import EditName from '@/pages/accounts/components/EditName.vue'
import { Chain, BaseWallet } from '@metalet/utxo-wallet-service'
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
const account = ref<V3Account>()

getNetwork().then((_network) => (network.value = _network))

getV3CurrentAccount().then((_currentAccountStorage) => {
  account.value = _currentAccountStorage
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

const openEditNameModal = ref(false)

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
      <div class="flex items-center gap-x-2">
        <span class="text-black-primary text-sm">{{ account.name }}</span>
        <PencilSquareIcon
          @click.stop
          @click="openEditNameModal = true"
          class="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-500 group-hover:inline"
        />
      </div>
      <EditName v-model:open="openEditNameModal" :account="account" />
    </FlexBox>
    <div class="flex items-center gap-x-4">
      <CopyIcon class="cursor-pointer hover:text-blue-primary" @click="isOpen = true" />
      <SettingMenu />
      <ServiceMenu class="cursor-pointer" />
    </div>
  </div>
  <Drawer v-model:open="isOpen" activeSnapPoint="#wallet">
    <DrawerContent>
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
            <div class="text-xs text-gray-primary break-all w-64">{{ btcWallet.address }}</div>
          </div>
          <CopyIcon
            class="cursor-pointer hover:text-blue-primary"
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
            <div class="text-xs text-gray-primary break-all w-64">{{ mvcWallet.address }}</div>
          </div>
          <CopyIcon
            class="cursor-pointer hover:text-blue-primary"
            @click="copy(mvcWallet.address, mvcWallet.addressType, 'Microvisionchain')"
          />
        </FlexBox>
      </FlexBox>
    </DrawerContent>
  </Drawer>
</template>

<style scoped lang="css"></style>
