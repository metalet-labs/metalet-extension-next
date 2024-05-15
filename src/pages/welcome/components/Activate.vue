<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Button } from '@/components'
import { useRouter } from 'vue-router'
import FailIcon from '@/assets/icons-v3/fail.svg'
import { WalletsStore } from '@/stores/WalletStore'
import { getCurrentAccountId, setCurrentAccountId } from '@/lib/account'
import LoadingIcon from '@/components/LoadingIcon.vue'
import BtcLogoIcon from '@/assets/icons-v3/btc-logo.svg?url'
import SpaceLogoIcon from '@/assets/icons-v3/space.svg?url'
import SuccessPNG from '@/assets/icons-v3/send-success.png'
import { genUID, formatIndex, Chain } from '@metalet/utxo-wallet-service'
import { getBackupV3Wallet, setBackupV3Wallet } from '@/lib/backup'
import NetworkTypeImg from '@/assets/icons/all-network-type.svg?url'
import { addV3Wallet, getV3Wallets, setCurrentWalletId } from '@/lib/wallet'
import { getServiceNetwork, getServiceNetworkStorage, setServiceNetwork } from '@/lib/network'
import { toast } from '@/components/ui/toast'

const loading = ref(true)
const error = ref<string>()
const router = useRouter()

type ActivateType = 'create' | 'import'

const { words, mvcTypes, type } = defineProps<{
  words: string[]
  mvcTypes: number[]
  type: ActivateType
}>()

const mnemonic = words.join(' ')
if (!mnemonic) {
  router.go(0)
}

const updateServiceNetwork = async (chain: Chain | 'all') => {
  const service = await getServiceNetworkStorage()
  const currentAccountId = await getCurrentAccountId()
  if (currentAccountId) {
    service[currentAccountId] = chain
    setServiceNetwork(service)
    router.replace('/wallet')
  } else {
    toast({ title: 'Please select a account', toastType: 'warning' })
    router.replace('/manage/wallets')
  }
}

onMounted(async () => {
  const wallets = await getV3Wallets()
  const hasWallet = wallets.find((wallet) => wallet.mnemonic === mnemonic)
  if (hasWallet) {
    loading.value = false
    error.value = 'Wallet already exists.'
    return
  }
  const walletId = genUID()
  const accountId = genUID()
  await addV3Wallet({
    id: walletId,
    name: `Wallet ${formatIndex(wallets.length + 1)}`,
    mnemonic,
    mvcTypes,
    accounts: [
      {
        id: accountId,
        name: 'Account 01',
        addressIndex: 0,
      },
    ],
  }).catch((err) => {
    error.value = err.message
    return
  })
  await setCurrentWalletId(walletId)
  await setCurrentAccountId(accountId)
  await WalletsStore.initWalletManager()
  if (type === 'import') {
    const walletIds = await getBackupV3Wallet()
    walletIds.push(walletId)
    setBackupV3Wallet(walletIds)
  }
  loading.value = false
})
</script>

<template>
  <div class="flex flex-col w-82">
    <!-- TODO: Add a loading screen -->
    <div
      v-if="loading"
      class="absolute top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="w-[108px] h-[108px] bg-white rounded-lg flex flex-col items-center justify-center gap-4">
        <LoadingIcon class="text-blue-primary" />
        <span>Loading</span>
      </div>
    </div>

    <div class="flex flex-col items-center">
      <img :src="SuccessPNG" alt="Send Success" class="w-30" v-if="!error" />
      <FailIcon class="w-30" v-else />
      <h1 class="text-2xl mt-6 font-medium">
        <span v-if="error">
          Wallet
          <span v-if="$props.type === 'create'">Created</span>
          <span v-if="$props.type === 'import'">Imported</span>
          Failed
        </span>
        <span v-else>
          Wallet
          <span v-if="$props.type === 'create'">Created</span>
          <span v-if="$props.type === 'import'">Imported</span>
          Successfully
        </span>
      </h1>
      <template v-if="!error">
        <p class="text-sm mt-12 text-gray-primary text-center w-80">
          Metalet currently supports the following chains.
          <br />
          Please select a network:
        </p>
        <div class="flex items-start gap-4 mt-4">
          <div class="flex flex-col gap-2 items-center cursor-pointer" @click="updateServiceNetwork('all')">
            <img :src="NetworkTypeImg" class="w-11" alt="All Networks" />
            <span class="text-xs text-gray-primary">All Networks</span>
          </div>
          <div class="flex flex-col gap-2 items-center cursor-pointer" @click="updateServiceNetwork(Chain.BTC)">
            <img :src="BtcLogoIcon" class="w-11" alt="Bitcoin" />
            <span class="text-xs text-gray-primary">Bitcoin</span>
          </div>
          <div class="flex flex-col gap-2 items-center cursor-pointer" @click="updateServiceNetwork(Chain.MVC)">
            <img :src="SpaceLogoIcon" class="w-11" alt="MicrovisonChain" />
            <span class="text-xs text-gray-primary">MicrovisonChain</span>
          </div>
        </div>
      </template>
      <Button v-else :class="['mt-26 w-61.5']" @click="$router.go(0)">Back To Step 1</Button>
      <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>
