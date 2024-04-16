<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Modal from '@/components/Modal.vue'
import { toast } from '@/components/ui/toast'
import { updateWalletName, updateAccountName } from '@/lib/wallet'

const props = defineProps<{
  open: boolean
  type: 'Wallet' | 'Account'
  name?: string
  walletId?: string
  accountId?: string
}>()

const name = ref()
const walletId = computed(() => props.walletId)
const accountId = computed(() => props.accountId)

watch(
  () => props.name,
  (_name) => {
    name.value = _name
  }
)

async function onUpdateName() {
  if (!walletId.value) {
    toast({ title: 'Please select a wallet', toastType: 'warning' })
    return
  }
  if (!name.value) {
    toast({ title: 'Please enter a name', toastType: 'warning' })
    return
  }
  if (props.type === 'Wallet') {
    await updateWalletName(walletId.value, name.value)
  } else if (props.type === 'Account') {
    if (!accountId.value) {
      toast({ title: 'Please select an account', toastType: 'warning' })
      return
    }
    await updateAccountName(walletId.value, accountId.value, name.value)
  }

  // TODO: No sense of refresh
  window.location.reload()
}
</script>

<template>
  <Modal :is-open="open" @update:is-open="$emit('update:open', $event)" title="Confirm">
    <template #title>Edit {{ $props.type }} Name</template>

    <template #body>
      <div class="mt-8">
        <input
          id="name"
          type="text"
          name="name"
          v-model="name"
          :placeholder="`${$props.type} Name`"
          class="block w-full rounded-md border border-gray-soft outline-blue-primary px-4 py-3.5 placeholder:text-gray-line sm:text-sm sm:leading-6"
        />
      </div>
    </template>

    <template #control>
      <div class="flex items-center justify-center gap-x-2">
        <button
          @click="$emit('update:open', false)"
          class="w-30 rounded-3xl bg-blue-light py-4 text-ss text-blue-primary"
        >
          Cancel
        </button>
        <button class="w-30 rounded-3xl bg-blue-primary py-4 text-ss text-white" @click="onUpdateName">Confirm</button>
      </div>
    </template>
  </Modal>
</template>
