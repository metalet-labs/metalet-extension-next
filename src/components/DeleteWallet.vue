<script lang="ts" setup>
import { computed } from 'vue'
import Modal from '@/components/Modal.vue'

const props = defineProps<{
  open: boolean
  name: string
  confirm: () => void
}>()

const walletName = computed(() => props.name)
</script>

<template>
  <Modal :is-open="open" @update:is-open="$emit('update:open', $event)" :title="$t('Common.Confirm')">
    <template #title>
      <div class="flex items-center gap-2 justify-center font-bold">
        <span>Are you sure you want to delete {{ walletName }}?</span>
      </div>
    </template>

    <template #body>
      <p class="text-sm text-gray-primary text-center">
        After deletion, you can restore this wallet by importing its seed phrase. Make sure it's backed up before
        deletion, or you'll permanently lose access to this wallet.
      </p>
    </template>

    <template #control>
      <div class="flex items-center justify-center gap-x-2">
        <button
          @click="$emit('update:open', false)"
          class="w-30 rounded-3xl bg-blue-light py-4 text-ss text-blue-primary"
        >
          {{ $t('Common.Cancel') }}
        </button>
        <button class="w-30 rounded-3xl bg-red-500 py-4 text-ss text-white" @click="confirm">Delete</button>
      </div>
    </template>
  </Modal>
</template>
