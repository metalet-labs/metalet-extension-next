<script lang="ts" setup>
import { ref } from 'vue'
import password from '@/lib/password'
import { useRouter } from 'vue-router'
import LockIcon from '@/assets/icons-v3/lock.svg'
import ResetModal from '@/components/ResetModal.vue'
import SettingIcon from '@/assets/icons-v3/setting.svg'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

const router = useRouter()

const hasPassword = ref(false)
password.has().then((has) => {
  hasPassword.value = has
})

const showResetModal = ref(false)

const toAccountList = () => {
  router.push('/accounts')
}
</script>

<template>
  <Menu as="div" class="relative z-[1] transition-all duration-200">
    <MenuButton class="relative flex items-center gap-x-0.5 py-1 hover:text-blue-primary">
      <SettingIcon class="cursor-pointer w-[22px]" />
    </MenuButton>

    <MenuItems class="absolute right-0 rounded-md border border-gray-100 bg-white text-xs shadow-md">
      <MenuItem>
        <router-link to="/settings" class="menu-item">
          <SettingIcon class="w-4.5" />
          <span>Setting</span>
        </router-link>
      </MenuItem>

      <MenuItem>
        <router-link to="/lock" class="menu-item" v-if="hasPassword">
          <LockIcon class="w-4.5" />
          <span>Lock</span>
        </router-link>
        <router-link to="/wallet/set-password" class="menu-item" v-else>Set Password</router-link>
      </MenuItem>

      <MenuItem v-if="false">
        <button class="menu-item" @click="toAccountList">Add / Switch Account</button>
      </MenuItem>

      <MenuItem v-if="hasPassword && false">
        <button class="menu-item" @click="showResetModal = true">Reset Account</button>
      </MenuItem>
    </MenuItems>
  </Menu>

  <ResetModal v-model:show="showResetModal" />
</template>

<style scoped lang="css">
.menu-item {
  @apply flex items-center gap-x-3 w-full whitespace-nowrap rounded-inherit p-4 text-left capitalize hover:bg-gray-50 hover:text-blue-500;
}

.reset-button {
  @apply rounded-lg border-2 py-3 text-sm font-bold;
}
</style>
