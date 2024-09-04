<script lang="ts" setup>
import { computed, ref } from 'vue'
import useStorage from '@/lib/storage'
import { Checkbox } from '@/components/ui/checkbox'
import { XMarkIcon } from '@heroicons/vue/20/solid'

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
  await storage.clear()
  emit('update:show', false)
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
      <div :data-state="modalState"
        class="data-[state=open]:animate-drawer-modal-up data-[state=closed]:animate-drawer-modal-down">
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
                <p>Metalet Wallet doesn't store your password and can't help you retrieve it.</p>
              </div>
              <div class="p-3.5 bg-gray-secondary rounded-lg flex items-center gap-x-3">
                <Checkbox id="tips1" v-model:checked="checked2" />
                <p>
                  If you forget your password, you can reset it by resetting your wallet. You can re-import your wallet
                  with its seed phrase or private key without affecting your assets.
                </p>
              </div>
              <div class="p-3.5 bg-gray-secondary rounded-lg flex items-center gap-x-3">
                <Checkbox id="tips1" v-model:checked="checked3" />
                <p>
                  If you reset the wallet without backing it up,you'll permanently lose it and all assets. Be sure to
                  back up all wallets and keep your seed phrase or private key safe before resetting.
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm">
                To confirm wallet reset, please enter:
                <span class="text-red-500">RESET</span>
              </p>
              <input type="text" class="w-full rounded-lg focus:outline-blue-primary border p-4 text-sm"
                v-model="resetText" placeholder="RESET" />
            </div>

            <div class="flex items-center justify-center gap-2">
              <button class="w-30 h-12 bg-blue-light text-blue-primary rounded-3xl text-ss"
                @click="$emit('update:show', false)">
                Cancel
              </button>
              <button @click="disconnect" :disabled="!checkedAll"
                class="w-30 h-12 bg-red-600 text-white rounded-3xl text-ss"
                :class="[checkedAll ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 saturate-50']">
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
