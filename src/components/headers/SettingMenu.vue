<script lang="ts" setup>
import { ref } from 'vue'
import { lock } from '@/lib/lock'
import password from '@/lib/password'
import { goToTab } from '@/lib/utils'
import { useRouter } from 'vue-router'
import { IS_DEV } from '@/data/config'
import LockIcon from '@/assets/icons-v3/lock.svg'
import ResetModal from '@/components/ResetModal.vue'
import SettingIcon from '@/assets/icons-v3/setting.svg'
import BrowserIcon from '@/assets/icons-v3/browser.svg'
import CollectionIcon from '@/assets/icons-v3/collection.svg'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

const router = useRouter()

const hasPassword = ref(false)
password.has().then((has) => {
  hasPassword.value = has
})

const showResetModal = ref(false)

const lockWallet = async () => {
  await lock()
  router.replace('/lock')
}
</script>

<template>
  <Menu as="div" class="relative z-[1] transition-all duration-200">
    <MenuButton class="relative flex items-center gap-x-0.5 py-1 hover:text-blue-primary">
      <SettingIcon class="cursor-pointer w-[22px]" />
    </MenuButton>

    <MenuItems
      class="absolute transform -translate-x-1/2 left-1/2 rounded-md border border-gray-100 bg-white text-xs shadow-md w-[170px]"
    >
      <MenuItem>
        <router-link to="/settings" class="menu-item">
          <SettingIcon class="w-4.5" />
          <span>Setting</span>
        </router-link>
      </MenuItem>
      <MenuItem>
        <router-link to="/wallet/connect-site" class="menu-item">
          <CollectionIcon />
          <span>Dapp connection</span>
        </router-link>
      </MenuItem>
      <MenuItem v-if="!IS_DEV">
        <button @click="goToTab('/wallet', true)" class="menu-item">
          <BrowserIcon />
          <span>Open in Window</span>
        </button>
      </MenuItem>

      <MenuItem>
        <button class="menu-item" v-if="hasPassword" @click="lockWallet">
          <LockIcon class="w-4.5" />
          <span>Lock</span>
        </button>
        <router-link to="/wallet/set-password" class="menu-item" v-else>
          <LockIcon class="w-4.5" />
          <span>Set Password</span>
        </router-link>
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
