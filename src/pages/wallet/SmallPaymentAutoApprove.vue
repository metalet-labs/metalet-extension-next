<script lang="ts" setup>
import { Switch } from '@headlessui/vue'
import hash from 'object-hash'
import { computed, onMounted, ref } from 'vue'
import { IS_DEV } from '@/data/config'
import { useRouter } from 'vue-router'
import passwordManager, { setTempPassword } from '@/lib/password'
import { PasswordInput } from '@/components'
import { toast } from '@/components/ui/toast'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { decrypt, encrypt, hashWithSha256 } from '@/lib/crypto'
import {
  backupV3EncryptedWalletsStorage,
  getV3EncryptedWalletsStorage,
  setV3EncryptedWalletsStorage,
} from '@/lib/wallet'
import useStorage from '@/lib/storage'
import { AutoPaymentAmountKey, AutoPaymentListKey, EnabledAutoPaymentKey } from '@/lib/actions/auto-payment'
import { ShieldCloseIcon, XIcon } from 'lucide-vue-next'
import router from '@/router'
const storage = useStorage()


const enabled = ref(true);
const amount = ref(10000);
const list = ref<{ logo?: string; host: string }[]>([]);
const handleEnabledChange = async (value: boolean) => {
  enabled.value = value
}

onMounted(async () => {
  const isEnabled = await storage.get(EnabledAutoPaymentKey, { defaultValue: true })
  enabled.value = isEnabled;
  const _amount = await storage.get(AutoPaymentAmountKey, { defaultValue: 10000 })
  amount.value = Number(_amount);
  const _list = await storage.get(AutoPaymentListKey, {
    defaultValue: [
    ]
  })
  list.value = _list
})

const next = async () => {

  await storage.set(EnabledAutoPaymentKey, enabled.value)
  await storage.set(AutoPaymentAmountKey, amount.value)
  await storage.set(AutoPaymentListKey, list.value)
  toast({
    title: 'Success',
    description: 'Settings saved successfully',
    toastType: 'success'
  })
  router.back()

}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="h-15 -my-3 flex items-center gap-3">
      <ChevronLeftIcon class="w-6 h-6 cursor-pointer" @click="$router.back()" />
    </div>
    <div class="space-y-2 pt-4">
      <h3 class="text-xl font-medium">
        {{ $t('SetPasswordPage.SmallPaymentAutoApprove') }}
      </h3>
      <p class="mt-2 text-sm text-gray-primary">
        {{ $t('SetPasswordPage.SmallPaymentAutoApproveTips') }}
      </p>
    </div>
    <div class="grow ">
      <div class="flex  items-center justify-between mt-6">
        <div>
          <h5 class="text-sm font-medium">
            {{ $t('SetPasswordPage.Enabled') }}
          </h5>
          <p class="mt-2 text-sm text-gray-primary">
            {{ $t('SetPasswordPage.AllowApprovedApps') }}
          </p>
        </div>
        <Switch v-model="enabled" @update:modelValue="handleEnabledChange"
          :class="enabled ? 'bg-blue-primary' : 'bg-gray-50 shadow-inner'"
          class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          <span aria-hidden="true" :class="enabled ? 'translate-x-6' : 'translate-x-0'"
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out" />
        </Switch>
      </div>
      <div class="mt-4">
        <h5 class="text-sm font-medium">
          {{ $t('SetPasswordPage.AllowMaximumAutoApproveAmount') }}
        </h5>
        <div class="flex  items-center justify-between  gap-6">
          <div class="flex flex-col items-start gap-x-2 mt-2">
            <span class="text-xs text-gray-primary"> MicrovisionChain:</span>
            <div :class="[
              'px-1.5',
              'py-0.5',
              'rounded',
              'text-xs',
              'inline-block',
              'scale-75',
              'origin-left',
              'bg-[rgba(247,147,26,0.2)] text-[#F7931A]',
              'text-nowrap'
            ]">
              {{ $t('Common.BitcoinSideChain') }}
            </div>
          </div>
          <div class="relative mt-2 w-full">
            <input min="0" type="number" v-model="amount" step="1000"
              class="w-full rounded-lg p-3 pr-12 text-xs border border-gray-soft focus:border-blue-primary focus:outline-none" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-primary">sats</span>
          </div>

        </div>
      </div>
      <div class="mt-4">
        <h5 class="text-sm font-medium">
          {{ $t('SetPasswordPage.ApprovedApps') }}
        </h5>
        <div class="mt-2 border-blue-primary rounded-lg p-3 border  min-h-[100px] max-h-[250px] overflow-y-auto">

          <div v-for="connection in list" class="flex items-center justify-between py-2" :key="connection.host">
            <div class="flex items-center gap-3">

              <span class="">{{ connection.host }}</span>
            </div>
            <XIcon class="cursor-pointer" @click="
              async () => {
                list = list.filter(item => item.host !== connection.host)
              }
            " />
          </div>


        </div>
      </div>





    </div>
    <div class="flex items-center justify-center gap-2 my-4">
      <button class="mx-auto w-61.5 h-12 bg-blue-primary rounded-3xl text-white" @click="next">
        {{ $t('Common.Confirm') }}
      </button>
    </div>
  </div>
</template>
