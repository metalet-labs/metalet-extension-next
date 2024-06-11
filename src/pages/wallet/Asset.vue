<script lang="ts" setup>
import Decimal from 'decimal.js'
import { computed, ref, watch } from 'vue'
import { updateAsset } from '@/lib/balance'
import { toast } from '@/components/ui/toast'
import { calcBalance } from '@/lib/formatters'
import { Copy, LoadingText } from '@/components'
import { useRoute, useRouter } from 'vue-router'
import { SymbolTicker } from '@/lib/asset-symbol'
import { prettifyAddress } from '@/lib/formatters'
import { BTCAsset, MVCAsset } from '@/data/assets'
import AssetLogo from '@/components/AssetLogo.vue'
import { useIconsStore } from '@/stores/IconsStore'
import { useBalanceQuery } from '@/queries/balance'
import { WalletsStore } from '@/stores/WalletStore'
import CloseIcon from '@/assets/icons-v3/close.svg?url'
import Activities from './components/Activities.vue'
import { notifyContent } from '@/lib/notify-content'
import FilterIcon from '@/assets/icons-v3/filter.svg?url'
import ToggleIcon from '@/assets/icons-v3/toggle.svg?url'
import ArrowUpIcon from '@/assets/icons-v3/arrow-up.svg'
import SelectorIcon from '@/assets/icons-v3/selector.svg?url'
import { setV3AddressTypeStorage } from '@/lib/addressType'
import ArrowDownIcon from '@/assets/icons-v3/arrow-down.svg'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg?url'
import { AddressType, Chain } from '@metalet/utxo-wallet-service'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import SuccessCheckedIcon from '@/assets/icons-v3/success-checked.svg'
import { useExchangeRatesQuery, CoinCategory } from '@/queries/exchange-rates'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import Divider from '@/components/Divider.vue'

const isOpen = ref(false)
const route = useRoute()
const router = useRouter()

const { updateWallet, currentBTCWallet, currentMVCWallet, getAddress } = useChainWalletsStore()
const address = computed(() => route.params.address as string)
const mvcAddress = getAddress(Chain.MVC)
const symbol = ref<SymbolTicker>(route.params.symbol as SymbolTicker)

const { getIcon } = useIconsStore()
const icon = computed(() => getIcon(CoinCategory.Native, route.params.symbol as SymbolTicker) || '')

const asset = computed(() => {
  if (symbol.value === 'BTC') {
    return BTCAsset
  }
  if (symbol.value === 'SPACE') {
    return MVCAsset
  }
})

const balaceEnabled = computed(() => {
  if (asset.value) {
    return !!address.value && !!symbol.value && !asset.value.balance
  }
  return false
})

const { isLoading, data: balance } = useBalanceQuery(address, symbol, { enabled: balaceEnabled })

const rateEnabled = computed(() => {
  if (asset.value) {
    return !!address.value && !!symbol.value
  }
  return false
})

const { isLoading: isExchangeRateLoading, data: exchangeRate } = useExchangeRatesQuery(
  symbol,
  ref(CoinCategory.Native),
  {
    enabled: rateEnabled,
  }
)

const assetUSD = computed(() => {
  if (isExchangeRateLoading.value) {
    return
  }
  const usdRate = new Decimal(exchangeRate.value?.price || 0)
  if (asset.value) {
    if (asset.value?.balance) {
      const balanceInStandardUnit = asset.value.balance.total.dividedBy(10 ** asset.value.decimal)
      return usdRate.mul(balanceInStandardUnit)
    } else if (balance.value && exchangeRate.value) {
      const balanceInStandardUnit = balance.value.total.dividedBy(10 ** asset.value.decimal)
      return usdRate.mul(balanceInStandardUnit)
    }
  }
})

watch(assetUSD, (_assetUSD) => {
  if (asset.value && _assetUSD) {
    updateAsset({ chain: asset.value.chain, name: asset.value.symbol, value: _assetUSD.toNumber() })
  }
})

const toSend = () => {
  router.push({
    name: 'send',
    params: {
      symbol: symbol.value,
      address: address.value,
    },
  })
}

const setAddressType = async (addressType: AddressType, _address: string) => {
  const chain = asset.value!.chain as Chain
  await setV3AddressTypeStorage(chain, addressType)
  await updateWallet(chain)
  isOpen.value = false
  notifyContent('accountsChanged')({ mvcAddress: mvcAddress.value, btcAddress: _address })
  router.replace(`/wallet/asset/${symbol.value}/${_address}`)
}

const chainWallets = ref()
WalletsStore.getAccountChainWallets().then((_chainWallets) => {
  chainWallets.value = _chainWallets[asset.value!.chain]!.map((wallet) => ({
    address: wallet.getAddress(),
    addressType: wallet.getAddressType(),
  }))
})

const toReceive = () => {
  router.push(`/wallet/receive/${symbol.value}/${address.value}?tag=${currentBTCWallet.value?.getAddressType()}`)
}
</script>

<template>
  <div class="flex flex-col items-center space-y-6 w-full" v-if="asset">
    <div class="w-full h-15 -my-3 flex items-center justify-between">
      <img :src="ArrowLeftIcon" alt="" class="w-3.5 cursor-pointer" @click="router.push('/wallet')" />
      <span>{{ symbol }}</span>
      <div class="w-3.5 cursor-pointer" @click="isOpen = true" title="Set Default Address" v-if="asset.chain === 'btc'">
        <img :src="ToggleIcon" alt="" />
      </div>
      <div v-else></div>
      <Drawer v-model:open="isOpen" activeSnapPoint="#chainWallets">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle class="text-center relative">
              <span>Set Default Address</span>
              <DrawerClose>
                <img :src="CloseIcon" alt="" class="absolute right-0 top-0" />
              </DrawerClose>
            </DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div class="flex flex-col items-center">
            <div
              v-for="wallet in chainWallets"
              class="h-15 w-full px-4 py-3 flex items-center justify-between cursor-pointer"
            >
              <div class="flex items-center gap-3 w-full" @click="setAddressType(wallet.addressType, wallet.address)">
                <img :src="icon" alt="" class="w-9" />
                <div class="space-y-1">
                  <div class="text-sm" :title="wallet.address">
                    {{ prettifyAddress(wallet.address) }}
                  </div>
                  <div class="text-xs text-gray-primary">{{ wallet.addressType }}</div>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1.5">
                <SuccessCheckedIcon v-show="wallet.address === address" class="w-5 h-5" />
                <!-- <span class="text-xs text-gray-primary">$0.00</span> -->
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
    <div class="flex flex-col items-center">
      <AssetLogo :logo="icon" :chain="asset.chain" :symbol="asset.symbol" type="network" class="w-15" />

      <div class="mt-3 text-2xl">
        <span v-if="balance">{{ calcBalance(balance.total.toNumber(), asset.decimal, asset.symbol) }}</span>
        <span v-else>-- {{ asset.symbol }}</span>
        <span v-if="assetUSD !== undefined" class="text-gray-primary ml-2">
          ≈ ${{ assetUSD?.toNumber().toFixed(2) }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-center gap-x-2">
      <button @click="toSend" class="btn-blue-light">
        <ArrowUpIcon class="w-3" />
        <span>Send</span>
      </button>
      <button @click="toReceive" class="btn-blue-primary">
        <ArrowDownIcon class="w-3" />
        <span>Receive</span>
      </button>
    </div>

    <Divider class="w-full -mx-4" />
    <div class="space-y-2 text-xs w-full border-gray-primary" v-if="asset.chain === 'btc'">
      <div>{{ currentBTCWallet?.getAddressType() }}</div>
      <div class="flex items-center justify-between text-gray-primary gap-4">
        <div class="break-all">{{ currentBTCWallet?.getAddress() }}</div>
        <Copy
          :text="address"
          class="w-[22px]"
          @click="
            toast({
              title: `${currentBTCWallet?.getAddressType()}  Address Copied`,
              toastType: 'success',
              description: address,
            })
          "
        />
      </div>
    </div>
    <div class="space-y-2 text-xs w-full border-gray-primary" v-else-if="asset.chain === 'mvc'">
      <div>{{ currentMVCWallet?.getAddressType() }}</div>
      <div class="flex items-center justify-between text-gray-primary gap-4">
        <div class="break-all">{{ currentMVCWallet?.getAddress() }}</div>
        <Copy
          :text="address"
          class="w-[22px]"
          @click="
            toast({
              title: `${currentMVCWallet?.getAddressType()}  Address Copied`,
              toastType: 'success',
              description: address,
            })
          "
        />
      </div>
    </div>

    <Divider class="w-full -mx-4" />

    <div class="w-full">
      <div class="-mx-4 h-11 bg-gray-light px-4 py-[13px] text-ss" v-if="false">
        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center justify-between w-full">
            <div class="flex items-center gap-x-2">
              <span>Time</span>
              <img :src="SelectorIcon" alt="" />
            </div>
            <img :src="FilterIcon" alt="" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="bg-white">
            <DropdownMenuItem @select="null">Time</DropdownMenuItem>
            <DropdownMenuItem @select="null">Other</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Activities
        class="mt-8 self-stretch"
        :asset="asset"
        :exchangeRate="Number(exchangeRate)"
        :address="address"
        :coinCategory="CoinCategory.Native"
      />
    </div>
  </div>
  <LoadingText v-else text="Asset Loading..." />
</template>

<style scoped lang="css">
.btn {
  @apply w-[119px] h-12 rounded-3xl flex items-center justify-center gap-x-2;
}

.btn-blue-light {
  @apply btn bg-blue-light text-blue-primary;
}

.btn-blue-primary {
  @apply btn bg-blue-primary text-white;
}

div[role='tablist'] {
  @apply p-0 h-auto;
}

button[role='tab'] {
  @apply flex flex-col items-center px-0 py-4 rounded-none border-b-2 border-transparent;
}

button[role='tab'][aria-selected='true'] {
  @apply border-blue-primary;
}

div[role='tabpanel'] {
  @apply px-3 py-4 mt-0;
}
</style>
