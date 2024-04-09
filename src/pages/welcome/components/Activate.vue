<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FlexBox, Button } from '@/components'
import FailIcon from '@/assets/icons-v3/fail.svg'
import { WalletsStore } from '@/stores/WalletStore'
import { setCurrentAccountId } from '@/lib/account'
import LoadingIcon from '@/components/LoadingIcon.vue'
import MoreIcon from '@/assets/icons-v3/more-crytos.svg'
import BtcLogoIcon from '@/assets/images/btc-logo.svg?url'
import SpaceLogoIcon from '@/assets/icons-v3/space.svg?url'
import SuccessPNG from '@/assets/icons-v3/send-success.png'
import { addV3Wallet, setCurrentWalletId } from '@/lib/wallet'

const loading = ref(true)
const error = ref<string>()
const router = useRouter()

const { words, mvcTypes } = defineProps({
  words: {
    type: Array<string>,
    required: true,
  },
  mvcTypes: {
    type: Array<number>,
    required: true,
  },
})

const mnemonic = words.join(' ')
if (!mnemonic) {
  router.go(0)
}

const walletsOptions = {
  mnemonic,
  mvcTypes,
  accountsOptions: [
    {
      addressIndex: 0,
    },
  ],
}

onMounted(async () => {
  try {
    if (WalletsStore.hasWalletManager()) {
      const walletManager = await WalletsStore.getWalletManager()
      const wallet = walletManager.addWallet(walletsOptions)
      addV3Wallet(wallet)
      setCurrentAccountId(wallet.accounts[0].id)
      setCurrentWalletId(wallet.id)
    } else {
      const walletManager = WalletsStore.initWalletManager([walletsOptions])
      const wallet = walletManager.findWallet(mnemonic)
      addV3Wallet(wallet)
      setCurrentAccountId(wallet.accounts[0].id)
      setCurrentWalletId(wallet.id)
    }
  } catch (_error) {
    error.value = _error as string
  }

  loading.value = false
})
</script>

<template>
  <FlexBox d="col" class="w-82">
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

    <FlexBox d="col" ai="center">
      <img :src="SuccessPNG" alt="Send Success" class="w-30" v-if="!error" />
      <FailIcon class="w-30" v-else />
      <h1 class="text-2xl mt-6 font-medium">
        <span v-if="error">Wallet created Failed</span>
        <span v-else>Wallet created Failed</span>
      </h1>
      <p class="text-sm mt-12 text-gray-primary">Metalet currently supports the following cryptos</p>
      <FlexBox ai="center" :gap="4" class="mt-4">
        <img :src="BtcLogoIcon" class="w-11" alt="Bitcoin" />
        <img :src="SpaceLogoIcon" class="w-11" alt="Space" />
        <MoreIcon />
      </FlexBox>
      <Button
        v-if="!error"
        type="primary"
        :class="['mt-26 w-61.5', { 'cursor-not-allowed opacity-50': loading || error }]"
        @click="() => $router.push('/wallet')"
        :disabled="!!error"
      >
        Activate Metalet
      </Button>
      <Button v-else :class="['mt-26 w-61.5']" @click="$router.go(0)">Back To Step 1</Button>
      <!-- error -->
      <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
    </FlexBox>
  </FlexBox>
</template>
