<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/components/ui/toast'
import { getCurrentAccountId } from '@/lib/account'
import { Chain } from '@metalet/utxo-wallet-service'
import SpaceLogoImg from '@/assets/icons-v3/space.svg?url'
import BtcLogoImg from '@/assets/icons-v3/btc-logo.svg?url'
import { RadioGroup, RadioGroupOption } from '@headlessui/vue'
import NetworkTypeImg from '@/assets/icons/all-network-type.svg?url'
import { getServiceNetwork, getServiceNetworkStorage, setServiceNetwork } from '@/lib/network'
import SuccessCheckedIcon from '@/assets/icons-v3/success-checked.svg'

const router = useRouter()

const service = ref<Chain | 'all'>('all')
getServiceNetwork().then(async (_service) => {
  service.value = _service
})

const updateServiceNetwork = async (chain: Chain | 'all') => {
  console.log(chain)
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
</script>

<template>
  <RadioGroup v-model="service" class="w-full space-y-[28.5px] mt-[30px]" @update:modelValue="updateServiceNetwork">
    <RadioGroupOption v-slot="{ checked }" value="all" class="flex items-center justify-between cursor-pointer">
      <div class="flex items-center gap-x-1.5">
        <img :src="NetworkTypeImg" alt="All Networks" class="inline-block w-8 h-8" />
        <span>All Networks</span>
      </div>
      <SuccessCheckedIcon v-if="checked" class="rounded-full w-5 h-5" />
    </RadioGroupOption>
    <RadioGroupOption v-slot="{ checked }" value="btc" class="flex items-center justify-between cursor-pointer">
      <div class="flex items-center gap-x-1.5">
        <img :src="BtcLogoImg" alt="Bitcoin" class="inline-block w-8 h-8" />
        <span>Bitcoin</span>
      </div>
      <SuccessCheckedIcon v-if="checked" class="rounded-full w-5 h-5" />
    </RadioGroupOption>
    <RadioGroupOption v-slot="{ checked }" value="mvc" class="flex items-center justify-between cursor-pointer">
      <div class="flex items-center gap-x-1.5">
        <img :src="SpaceLogoImg" alt="Bitcoin" class="inline-block w-8 h-8" />
        <span>Microvisionchain</span>
      </div>
      <SuccessCheckedIcon v-if="checked" class="rounded-full w-5 h-5" />
    </RadioGroupOption>
  </RadioGroup>
</template>

<style scoped lang="css">
div[role='tablist'] {
  @apply space-x-[18px] mt-[30px] mb-[27px];
}

button[role='tab'] {
  @apply border-0 py-3;
}

button[aria-selected='false'] {
  @apply text-[#BFC2CC];
}

button[aria-selected='true'] {
  outline: none;
  @apply text-[#1E2BFF] border-b-2 border-[#1E2BFF];
}
</style>
