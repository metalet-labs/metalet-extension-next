<script lang="ts" setup>
import * as z from 'zod'
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { useRouter } from 'vue-router'
import { toast } from '@/components/ui/toast'
import { toTypedSchema } from '@vee-validate/zod'
import { Checkbox } from '@/components/ui/checkbox'
import { getCurrentAccountId } from '@/lib/account'
import { Chain } from '@metalet/utxo-wallet-service'
import SpaceLogoImg from '@/assets/icons-v3/space.svg?url'
import BtcLogoImg from '@/assets/icons-v3/btc-logo.svg?url'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { getServiceNetwork, getServiceNetworkStorage, setServiceNetwork } from '@/lib/network'

const selectedChains = ref<Chain[]>([])

const chains = [
  {
    id: Chain.BTC,
    name: 'Bitcoin',
    logo: BtcLogoImg,
  },
  {
    id: Chain.MVC,
    name: 'MicrovisionChain',
    logo: SpaceLogoImg,
  },
]

const formSchema = toTypedSchema(
  z.object({
    chains: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: 'Please select at least one network service before launching.',
    }),
  })
)

const router = useRouter()

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    chains: Object.values(Chain),
  },
})

getServiceNetwork().then(async (chains) => {
  setFieldValue('chains', chains)
  selectedChains.value = chains
})

const onSubmit = handleSubmit(({ chains }) => {
  updateServiceNetwork(chains as Chain[])
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
</script>

<template>
  <form @submit="onSubmit" class="min-h-full flex flex-col">
    <FormField name="chains">
      <FormItem class="grow space-y-[28.5px]">
        <FormField
          name="chains"
          :key="chain.id"
          type="checkbox"
          :value="chain.id"
          v-for="chain in chains"
          :unchecked-value="false"
          v-slot="{ value, handleChange }"
        >
          <FormItem class="flex items-center space-y-0 justify-between cursor-pointer" @click="selectChain(chain.id)">
            <FormLabel class="flex items-center gap-2 cursor-pointer" @click="selectChain">
              <img :src="chain.logo" alt="Bitcoin" class="inline-block w-8 h-8" />
              <span class="text-base">{{ chain.name }}</span>
            </FormLabel>
            <FormControl>
              <Checkbox
                @update:checked="handleChange"
                :checked="value.includes(chain.id)"
                class="rounded-full data-[state=checked]:bg-green-success data-[state=checked]:border-none w-5 h-5 text-xs"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormMessage class="text-red-500 text-center" />
      </FormItem>
    </FormField>

    <button
      type="submit"
      :class="[
        'mx-auto w-61.5 rounded-3xl py-4 text-center text-ss text-white bg-blue-primary my-12',
        { 'opacity-50 cursor-not-allowed': !selectedChains.length },
      ]"
    >
      Confirm
    </button>
  </form>
</template>

<style scoped lang="css"></style>
