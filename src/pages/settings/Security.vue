<script lang="ts" setup>
import { ref } from 'vue'
import ResetModal from '@/components/ResetModal.vue'
import ArrowRightIcon from '@/assets/icons-v3/arrow_right.svg?url'

const showResetModal = ref(false)
</script>

<template>
  <div class="-mx-4">
    <router-link
      to="/wallet/set-password"
      class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4"
    >
      <span>Change Password</span>
      <img :src="ArrowRightIcon" alt="" />
    </router-link>
    <div class="h-15 flex items-center cursor-pointer rounded-lg px-4">
      <span class="text-red-500 hover:underline" @click="showResetModal = true">Reset wallet</span>
    </div>
  </div>
  <ResetModal v-model:show="showResetModal" />
</template>
