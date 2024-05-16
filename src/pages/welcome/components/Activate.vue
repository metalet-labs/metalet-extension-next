<script lang="ts" setup>
import * as z from 'zod'
import { onMounted, ref } from 'vue'
import { Button } from '@/components'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toast } from '@/components/ui/toast'
import { toTypedSchema } from '@vee-validate/zod'
import FailIcon from '@/assets/icons-v3/fail.svg'
import { Checkbox } from '@/components/ui/checkbox'
import { WalletsStore } from '@/stores/WalletStore'
import LoadingIcon from '@/components/LoadingIcon.vue'
import BtcLogoIcon from '@/assets/icons-v3/btc-logo.svg?url'
import SpaceLogoIcon from '@/assets/icons-v3/space.svg?url'
import SuccessPNG from '@/assets/icons-v3/send-success.png'
import { getBackupV3Wallet, setBackupV3Wallet } from '@/lib/backup'
import { getCurrentAccountId, setCurrentAccountId } from '@/lib/account'
import { genUID, formatIndex, Chain } from '@metalet/utxo-wallet-service'
import { getServiceNetworkStorage, setServiceNetwork } from '@/lib/network'
import { addV3Wallet, getV3Wallets, setCurrentWalletId } from '@/lib/wallet'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const loading = ref(true)
const error = ref<string>()
const router = useRouter()

const selectedChains = ref<Chain[]>(Object.values(Chain))

const chains = [
  {
    id: Chain.BTC,
    name: 'Bitcoin',
    logo: BtcLogoIcon,
  },
  {
    id: Chain.MVC,
    name: 'MicrovisionChain',
    logo: SpaceLogoIcon,
  },
]

const formSchema = toTypedSchema(
  z.object({
    chains: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: 'Please select at least one network service before launching.',
    }),
  })
)

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    chains: Object.values(Chain),
  },
})

const updateServiceNetwork = async (chains: Chain[]) => {
  const service = await getServiceNetworkStorage()
  const currentAccountId = await getCurrentAccountId()
  if (currentAccountId) {
    service[currentAccountId] = chains
    setServiceNetwork(service)
    router.replace('/wallet')
  } else {
    toast({ title: 'Please select a account', toastType: 'warning' })
    router.replace('/manage/wallets')
  }
}

const selectChain = (chain: Chain) => {
  console.log('start', chain, selectedChains.value)

  if (selectedChains.value.includes(chain)) {
    selectedChains.value = selectedChains.value.filter((item) => item !== chain)
  } else {
    selectedChains.value.push(chain)
  }
  console.log('end', chain, selectedChains.value)
}

const onSubmit = handleSubmit(({ chains }) => {
  updateServiceNetwork(chains as Chain[])
})

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
        <p class="mt-6">Please select a network:</p>
        <p class="text-sm mt-2 text-gray-primary text-center w-96">
          Metalet currently supports the following blockchain networks. (Supports multiple selections)
        </p>
        <form @submit="onSubmit" class="mt-9 relative">
          <FormField name="chains">
            <FormItem class="flex items-center gap-8">
              <FormField
                name="chains"
                :key="chain.id"
                type="checkbox"
                :value="chain.id"
                v-for="chain in chains"
                :unchecked-value="false"
                v-slot="{ value, handleChange }"
              >
                <FormItem
                  :class="[
                    'flex flex-col items-center justify-center cursor-pointer bg-[#F8F8FA] w-30 h-[130px] rounded-lg gap-2',
                    { 'border border-blue-primary': selectedChains.includes(chain.id) },
                  ]"
                >
                  <FormLabel class="flex flex-col items-center gap-2 cursor-pointer">
                    <img :src="chain.logo" alt="Bitcoin" class="inline-block w-[38px] h-[38px]" />
                    <span class="text-xs">{{ chain.name }}</span>
                  </FormLabel>
                  <FormControl>
                    <Checkbox
                      @click="selectChain(chain.id)"
                      @update:checked="handleChange"
                      :checked="value.includes(chain.id)"
                      class="rounded-full data-[state=checked]:bg-green-success data-[state=checked]:border-none w-5 h-5 text-xs"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </FormItem>
            <FormMessage class="text-red-500 text-ss text-center absolute bottom-[60px] w-full" />
          </FormField>

          <button
            type="submit"
            :class="[
              'w-full rounded-3xl py-4 text-center text-ss text-white bg-blue-primary mt-16',
              { 'opacity-50 cursor-not-allowed': !selectedChains.length },
            ]"
          >
            Launch Metalet
          </button>
        </form>
      </template>
      <Button v-else :class="['mt-26 w-61.5']" @click="$router.replace('/welcome')">Back To Welcome</Button>
      <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>
