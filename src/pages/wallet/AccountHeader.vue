<script lang="ts" setup>
import { ref, computed } from 'vue'
import { FlexBox } from '@/components'
import { useRouter } from 'vue-router'
import { getMetaId } from '@/lib/metaId'
import { getNetwork } from '@/lib/network'
import Avatar from '@/components/Avatar.vue'
import { UseImage } from '@vueuse/components'
import CopyIcon from '@/assets/icons-v3/copy.svg'
import { prettifyAddress } from '@/lib/formatters'
import CloseIcon from '@/assets/icons-v3/close.svg'
import { WalletsStore } from '@/stores/WalletStore'
import { useMetaidInfoQuery } from '@/queries/metaid'
import { V3Wallet, type V3Account } from '@/lib/types'
import BtcLogo from '@/assets/icons-v3/btc-logo.svg?url'
import SpaceLogo from '@/assets/icons-v3/space.svg?url'
import { useToast } from '@/components/ui/toast/use-toast'
import ServiceMenu from '@/components/headers/ServiceMenu.vue'
import SettingMenu from '@/components/headers/SettingMenu.vue'
import { getServiceNetwork, type Service } from '@/lib/network'
import { Chain, BaseWallet } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import TriangleDownIcon from '@/assets/icons-v3/triangle-down.svg'
import { getV3CurrentAccount, getV3CurrentWallet } from '@/lib/wallet'
import {
  Drawer,
  DrawerClose,
  DrawerTitle,
  DrawerHeader,
  DrawerContent,
  DrawerDescription,
} from '@/components/ui/drawer'

const { getAddress } = useChainWalletsStore()

const { toast } = useToast()

const network = ref()
const chainWallets = ref()
const isOpen = ref(false)
const router = useRouter()
const wallet = ref<V3Wallet>()
const account = ref<V3Account>()
const serviceNetwork = ref<Service>([])

const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)

getServiceNetwork().then((_serviceNetwork) => {
  serviceNetwork.value = _serviceNetwork
})

const { data: btcMetaidInfo } = useMetaidInfoQuery(btcAddress, {
  enabled: computed(() => !!btcAddress),
})
const { data: mvcMetaidInfo } = useMetaidInfoQuery(mvcAddress, {
  enabled: computed(() => !!mvcAddress && btcAddress.value !== mvcAddress.value),
})

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
  <div class="flex items-center justify-between">
    <FlexBox ai="center" jc="center" :gap="2" class="cursor-pointer" @click="toManageWallets" v-if="account">
      <div class="flex items-center">
        <template v-if="serviceNetwork.includes(Chain.BTC)">
          <Avatar :id="btcAddress" class="z-10" v-if="!btcMetaidInfo" />
          <UseImage :src="btcMetaidInfo.avatar" class="z-10 h-10 w-10 rounded-full border border-gray-soft" v-else>
            <template #loading>
              <Avatar :id="btcAddress" class="z-10" />
            </template>
            <template #error>
              <Avatar :id="btcAddress" class="z-10" />
            </template>
          </UseImage>
        </template>

        <template v-if="btcAddress !== mvcAddress && serviceNetwork.includes(Chain.MVC)">
          <Avatar :id="mvcAddress" :class="{ '-ml-5': serviceNetwork.includes(Chain.BTC) }" v-if="!mvcMetaidInfo" />
          <UseImage
            v-else
            :src="mvcMetaidInfo.avatar"
            :class="
              serviceNetwork.includes(Chain.BTC)
                ? '-ml-5 z-10 h-10 w-10 rounded-full border border-gray-soft'
                : 'z-10 h-10 w-10 rounded-full border border-gray-soft'
            "
          >
            <template #loading>
              <Avatar :id="mvcAddress" :class="{ '-ml-5': serviceNetwork.includes(Chain.BTC) }" />
            </template>
            <template #error>
              <Avatar :id="mvcAddress" :class="{ '-ml-5': serviceNetwork.includes(Chain.BTC) }" />
            </template>
          </UseImage>
        </template>
      </div>
      <div class="flex flex-col" v-if="wallet">
        <div class="text-gray-black text-xs text-gray-primary">
          <span>{{ wallet.name }}</span>
        </div>
        <div class="flex items-center gap-x-2 text-gray-black">
          <span class="text-ss max-w-28 truncate">{{ btcMetaidInfo?.name || mvcMetaidInfo?.name || account.name }}</span>
          <!-- <template v-if="btcAddress !== mvcAddress && mvcMetaidInfo?.name">
            <span>/</span>
            <span class="text-ss">{{ mvcMetaidInfo?.name }}</span>
          </template> -->
          <TriangleDownIcon class="w-2" />
        </div>
        <div class="text-gray-black text-xs text-gray-primary space-x-0.5">
          <span>MetaID:</span>
          <span>{{ getMetaId(btcAddress) || getMetaId(mvcAddress) }}</span>
          <!-- <template v-if="btcAddress !== mvcAddress">
            <span>/</span>
            <span>{{ getMetaId(mvcAddress) }}</span>
          </template> -->
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
              <span class="text-xs bg-gray-soft px-2 py-0.5 rounded-sm">
                {{ btcWallet.addressType === 'Same as MVC' ? 'Default' : btcWallet.addressType }}
              </span>
            </div>
            <div class="text-xs text-gray-primary w-64">{{ prettifyAddress(btcWallet.address) }}</div>
          </div>
          <CopyIcon
            class="cursor-pointer hover:text-blue-primary w-4.5"
            @click="
              copy(
                btcWallet.address,
                btcWallet.addressType === 'Same as MVC' ? 'Default' : btcWallet.addressType,
                'Bitcoin'
              )
            "
          />
        </FlexBox>
        <FlexBox ai="center" :gap="2" v-if="chainWallets.mvc" v-for="mvcWallet in chainWallets.mvc">
          <img :src="SpaceLogo" alt="Bitcoin" class="w-8" />
          <div>
            <div class="space-x-2">
              <span>MicrovisionChain</span>
              <span class="text-xs bg-gray-soft px-2 py-0.5 rounded-sm">{{ mvcWallet.addressType }}</span>
            </div>
            <div class="text-xs text-gray-primary w-64">{{ prettifyAddress(mvcWallet.address) }}</div>
          </div>
          <CopyIcon
            class="cursor-pointer hover:text-blue-primary w-4.5"
            @click="copy(mvcWallet.address, mvcWallet.addressType, 'MicrovisionChain')"
          />
        </FlexBox>
      </FlexBox>
    </DrawerContent>
  </Drawer>
</template>

<style scoped lang="css"></style>
