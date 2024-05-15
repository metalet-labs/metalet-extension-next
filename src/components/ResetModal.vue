<script lang="ts" setup>
import { computed, ref } from 'vue'
import useStorage from '@/lib/storage'
import { PASSWORD_KEY } from '@/lib/password'
import { Checkbox } from '@/components/ui/checkbox'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { V3_WALLETS_STORAGE_KEY } from '@/lib/wallet'

defineProps<{
  show: boolean
}>()

const storage = useStorage()

const emit = defineEmits(['update:show'])

const resetText = ref('')
const checked1 = ref(false)
const checked2 = ref(false)
const checked3 = ref(false)

const checkedAll = computed(() => checked1.value && checked2.value && checked3.value && resetText.value === 'RESET')

const disconnect = async () => {
  emit('update:show', false)
  await storage.delete(PASSWORD_KEY)
  await storage.delete(V3_WALLETS_STORAGE_KEY)
  window.location.reload()
}

const modalState = ref<'open' | 'closed'>('open')

const close = () => {
  modalState.value = 'closed'
  const timeId = setTimeout(() => {
    clearTimeout(timeId)
    emit('update:show', false)
    modalState.value = 'open'
  }, 150)
}
</script>

<template>
  <Teleport to="main" v-if="show">
    <div class="absolute inset-0 isolate z-50 flex items-end bg-black/20 backdrop-blur-sm flex-col overflow-hidden">
      <div class="grow w-full" @click="close"></div>
      <div
        :data-state="modalState"
        class="data-[state=open]:animate-drawer-modal-up data-[state=closed]:animate-drawer-modal-down"
      >
        <div class="rounded-t-xl bg-white p-4 pb-8">
          <div class="flex items-center justify-between border-b border-gray-100 pb-4">
            <span class="text-base">Reset Wallet</span>
            <button class="text-gray-400 hover:text-gray-500" @click="close" type="button">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div class="pt-4 space-y-4">
            <div class="flex flex-col gap-2 text-ss">
              <div class="p-3.5 bg-gray-secondary rounded-lg flex items-center gap-x-3">
                <Checkbox id="tips1" v-model:checked="checked1" />
                <p>We neither retain nor furnish assistance in the retrieval of your password.</p>
              </div>
              <div class="p-3.5 bg-gray-secondary rounded-lg flex items-center gap-x-3">
                <Checkbox id="tips1" v-model:checked="checked2" />
                <p>
                  Should you misplace your password, you have the option to reset the wallet. Alternatively,
                  re-importation of the wallet utilizing the mnemonic phrase or private key is also feasible.
                </p>
              </div>
              <div class="p-3.5 bg-gray-secondary rounded-lg flex items-center gap-x-3">
                <Checkbox id="tips1" v-model:checked="checked3" />
                <p>
                  Please be advised that the resetting of the wallet without a prior backup will result in the permanent
                  loss of all assets. Prior to undertaking the reset process, ensure to create backups of all wallets.
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm">
                Should you affirm your intent to reset your wallet, kindly input the following below:
                <span class="text-red-500">RESET</span>
              </p>
              <input
                type="text"
                class="w-full rounded-lg focus:outline-blue-primary border p-4 text-sm"
                v-model="resetText"
                placeholder="RESET"
              />
            </div>

            <div class="flex items-center justify-center gap-2">
              <button
                class="w-30 h-12 bg-blue-light text-blue-primary rounded-3xl text-ss"
                @click="$emit('update:show', false)"
              >
                Cancel
              </button>
              <button
                @click="disconnect"
                :disabled="!checkedAll"
                class="w-30 h-12 bg-red-600 text-white rounded-3xl text-ss"
                :class="[checkedAll ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 saturate-50']"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="css">
.reset-button {
  @apply rounded-lg border-2 py-3 text-sm;
}
</style>
