<script lang="ts" setup>
import * as z from 'zod'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components'
import { useForm } from 'vee-validate'
import { encrypt } from '@/lib/crypto'
import { useRouter } from 'vue-router'
import { getPassword } from '@/lib/lock'
import { toast } from '@/components/ui/toast'
import { toTypedSchema } from '@vee-validate/zod'
import FailIcon from '@/assets/icons-v3/fail.svg'
import { Checkbox } from '@/components/ui/checkbox'
import { WalletsStore } from '@/stores/WalletStore'
import LoadingIcon from '@/components/LoadingIcon.vue'
import NetworkIcon from '@/assets/icons-v3/network.svg'
import SpaceLogoIcon from '@/assets/icons-v3/space.svg?url'
import BtcLogoIcon from '@/assets/icons-v3/btc-logo.svg?url'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { getBackupV3Wallet, setBackupV3Wallet } from '@/lib/backup'
import { getCurrentAccountId, setCurrentAccountId } from '@/lib/account'
import { genUID, formatIndex, Chain } from '@metalet/utxo-wallet-service'
import { getServiceNetworkStorage, setServiceNetwork } from '@/lib/network'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { addV3Wallet, getV3EncryptedWallets, getV3WalletsNum, setCurrentWalletId, setV3WalletsNum } from '@/lib/wallet'


const { updateAllWallets } = useChainWalletsStore()

type ActivateType = 'Create' | 'Import'

const props = defineProps<{
  words: string[]
  mvcTypes: number[]
  type: ActivateType
}>()

const type = computed(() => props.type)
const mnemonic = computed(() => props.words.join(' '))
const mvcTypes = computed(() => props.mvcTypes)

const loading = ref(false)
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
      message: 'Choose at least one network.',
    }),
  })
)

const { handleSubmit } = useForm({
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
  if (selectedChains.value.includes(chain)) {
    selectedChains.value = selectedChains.value.filter((item) => item !== chain)
  } else {
    selectedChains.value.push(chain)
  }
}

const onSubmit = handleSubmit(async ({ chains }) => {
  await addWallet()
  await updateServiceNetwork(chains as Chain[])
})

watch(mnemonic, (mnemonic) => {
  if (!mnemonic) {
    router.go(0)
  }
})

const addWallet = async () => {
  try {
    const password = await getPassword()
    const wallets = await getV3EncryptedWallets()
    const hasWallet = wallets.find((wallet) => wallet.mnemonic === encrypt(mnemonic.value, password))
    if (hasWallet) {
      loading.value = false
      error.value = 'Wallet already exists.'
      return
    }
    const walletId = genUID()
    const accountId = genUID()
    const walletNum = await getV3WalletsNum()
    const encryptedMnemonic = encrypt(mnemonic.value, password)

    await addV3Wallet({
      id: walletId,
      name: `Wallet ${formatIndex(walletNum + 1)}`,
      mnemonic: encryptedMnemonic,
      mvcTypes: mvcTypes.value,
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
    await setV3WalletsNum(walletNum + 1)
    await setCurrentWalletId(walletId)
    await setCurrentAccountId(accountId)
    if (WalletsStore.hasWalletManager()) {
      await WalletsStore.addWalletOnlyAccount(walletId, accountId)
    } else {
      await WalletsStore.initWalletManager()
    }
    await updateAllWallets()
    if (type.value === 'Import') {
      const walletIds = await getBackupV3Wallet()
      walletIds.push(walletId)
      setBackupV3Wallet(walletIds)
    }
    loading.value = false
  } catch (err) {
    error.value = (err as Error).message
  }
}
</script>

<template>
  <div class="flex flex-col w-82">
    <!-- TODO: Add a loading screen -->
    <div v-if="loading"
      class="absolute top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div class="w-[108px] h-[108px] bg-white rounded-lg flex flex-col items-center justify-center gap-4">
        <LoadingIcon class="text-blue-primary" />
        <span>Loading</span>
      </div>
    </div>

    <div class="flex flex-col items-center">
      <NetworkIcon class="w-16" v-if="!error" />
      <FailIcon class="w-30" v-else />
      <h1 class="text-2xl mt-6 font-medium">
        <span v-if="error">
          Wallet
          <span v-if="$props.type === 'Create'">Created</span>
          <span v-if="$props.type === 'Import'">Imported</span>
          Failed
        </span>
        <span v-else>Please select a network</span>
      </h1>
      <template v-if="!error">
        <form @submit="onSubmit" class="mt-9 relative w-full">
          <FormField name="chains">
            <FormItem class="flex flex-col items-center gap-8 w-full relative">
              <FormField name="chains" :key="chain.id" type="checkbox" :value="chain.id" v-for="chain in chains"
                :unchecked-value="false" v-slot="{ value, handleChange }">
                <FormItem :class="[
                  'flex items-center justify-between cursor-pointer px-[18px] py-3 bg-[#F8F8FA] w-full rounded-lg gap-2 relative',
                  { 'border border-blue-primary': selectedChains.includes(chain.id) },
                ]">
                  <FormLabel class="flex items-center gap-2 cursor-pointer">
                    <img :src="chain.logo" alt="Bitcoin" class="inline-block size-10" />
                    <div class="text-xs flex flex-col gap-1">
                      <span>{{ chain.name }}</span>
                      <span v-if="chain.name === 'MicrovisionChain'"
                        class="text-xs px-2 py-1 scale-75 origin-left rounded-full bg-[#F7931A]/20 text-[#F7931A]">
                        Bitcoin sidechain
                      </span>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Checkbox @click="selectChain(chain.id)" @update:checked="handleChange"
                      :checked="value.includes(chain.id)"
                      class="rounded-full data-[state=checked]:bg-green-success data-[state=checked]:border-none w-5 h-5 text-xs" />
                  </FormControl>
                  <p class="absolute -bottom-8 left-0 flex items-center gap-x-1 text-sm"
                    v-if="chain.name === 'MicrovisionChain' && value.includes(chain.id) && type === 'Import'">
                    <span class="text-gray-primary">Choose</span>
                    <span class="underline text-blue-primary" @click="$emit('openSelectMvcPath')">MVC Address</span>
                    <span v-tooltip="'Import the MVC wallet by modifying the HD Path.'">
                      <QuestionMarkCircleIcon class="w-3.5" />
                    </span>
                  </p>
                </FormItem>
              </FormField>
            </FormItem>
            <FormMessage class="text-red-500 text-ss text-center absolute bottom-[60px] w-full" />
          </FormField>

          <button type="submit" :class="[
            'w-full rounded-3xl py-4 text-center text-ss text-white bg-blue-primary mt-16',
            { 'opacity-50 cursor-not-allowed': !selectedChains.length },
          ]">
            Launch Metalet
          </button>
        </form>
      </template>
      <Button v-else :class="['mt-26 w-61.5']" @click="$router.replace('/welcome')">Back To Welcome Page</Button>
      <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>
