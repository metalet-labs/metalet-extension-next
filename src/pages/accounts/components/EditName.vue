<script lang="ts" setup>
import { ref } from 'vue'

import { getCurrentAccount, type Account, updateName } from '@/lib/account'

import Modal from '@/components/Modal.vue'

defineProps<{
  open: boolean
  type: 'Wallet' | 'Account'
}>()

// const emit = defineEmits(['update:open'])

const currentAccount = ref<Account>()
getCurrentAccount().then((acc) => {
  currentAccount.value = acc
})
const name = ref(currentAccount.value?.name)
async function onUpdateName() {
  console.log(name.value)

  // if (currentAccount.value && name.value) {
  //   await updateName(name.value)
  // }

  // // Refresh
  // window.location.reload()
}
</script>

<template>
  <Modal :is-open="open" @update:is-open="$emit('update:open', $event)" :title="$t('Common.Confirm')">
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
          {{ $t('Common.Cancel') }}
        </button>
        <button class="w-30 rounded-3xl bg-blue-primary py-4 text-ss text-white" @click="onUpdateName">
          {{ $t('Common.Confirm') }}
        </button>
      </div>
    </template>
  </Modal>
</template>
