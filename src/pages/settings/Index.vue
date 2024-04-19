<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import passwordManager from '@/lib/password'
import { IS_DEV, VERSION } from '@/data/config'
import ResetModal from '@/components/ResetModal.vue'
import LinkIcon from '@/assets/icons-v3/link.svg?url'
import SelectNetwork from './components/SelectNetwork.vue'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import ManageIcon from '@/assets/icons-v3/setting/manage.svg'
import BackupIcon from '@/assets/icons-v3/setting/backup.svg'
import NetworkIcon from '@/assets/icons-v3/setting/network.svg'
import MetaletIcon from '@/assets/icons-v3/setting/metalet.svg'
import SupportIcon from '@/assets/icons-v3/setting/support.svg'
import ToolkitIcon from '@/assets/icons-v3/setting/toolkit.svg'
import SecurityIcon from '@/assets/icons-v3/setting/security.svg'
import ArrowRightIcon from '@/assets/icons-v3/arrow_right.svg?url'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

function openWindowMode() {
  const indexLocation = window.location.href.replace('settings', 'wallet')
  window.open(indexLocation, '_blank')
}

const router = useRouter()

const hasPassword = ref(false)
passwordManager.has().then((has) => {
  hasPassword.value = has
})

const toDiscord = () => {
  window.open('https://discord.gg/4FDEq8cJHj', '_blank')
}

const toGithub = () => {
  window.open('https://github.com/mvc-labs/metalet-extension', '_blank')
}

const toTerms = () => {
  window.open('https://docs.google.com/document/d/1JFUS6f3Vs3Jh2CA4xpTixOUaMto4pANxmM_7b3suut8/edit', '_blank')
}

const toPolicy = () => {
  window.open('https://docs.google.com/document/d/1MyCcA9E6sVd6ThvQaocBeN07umYUJB4zhbhT3E4LxWw/edit', '_blank')
}

const toCurrentAccount = () => {
  router.push('/settings/current-account')
}

const toAddressType = () => {
  router.push('/settings/address-type')
}

const setPassword = () => {
  router.push('/wallet/set-password')
}

const toBackup = () => {
  router.push('/wallet/backup')
}

const toConnectedDapps = () => {
  router.push('/connected-dapps')
}

const toSecurityLab = () => {
  router.push('/settings/security-lab')
}

const toToolkit = () => {
  router.push('/settings/toolkit')
}

const showResetModal = ref(false)
</script>

<template>
  <div class="-mx-4">
    <router-link
      to="/wallet/backup"
      class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4"
    >
      <div class="flex items-center gap-3">
        <BackupIcon />
        <span>Backup</span>
      </div>
      <img :src="ArrowRightIcon" alt="" />
    </router-link>
    <router-link
      to="/wallet/backup"
      class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4"
    >
      <div class="flex items-center gap-3">
        <SecurityIcon />
        <span>Wallet Security</span>
      </div>
      <img :src="ArrowRightIcon" alt="" />
    </router-link>
    <router-link
      to="/manage/wallets"
      class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4"
    >
      <div class="flex items-center gap-3">
        <ManageIcon />
        <span>Management</span>
      </div>
      <img :src="ArrowRightIcon" alt="" />
    </router-link>
    <div class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4">
      <div class="flex items-center gap-3">
        <NetworkIcon />
        <span>Network</span>
      </div>
      <SelectNetwork />
    </div>
    <div class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4">
      <div class="flex items-center gap-3">
        <MetaletIcon />
        <span>About Metalet</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-sm text-gray-primary">{{ VERSION }}</span>
        <img :src="ArrowRightIcon" alt="" />
      </div>
    </div>
    <router-link
      to="/settings/toolkit"
      class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4"
    >
      <div class="flex items-center gap-3">
        <ToolkitIcon />
        <span>Toolkit</span>
      </div>
      <img :src="ArrowRightIcon" alt="" />
    </router-link>
    <div
      class="h-15 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-secondary rounded-lg px-4"
      v-if="false"
    >
      <div class="flex items-center gap-3">
        <SupportIcon />
        <span>Technical Support</span>
      </div>
      <img :src="LinkIcon" alt="" class="w-4.5" />
    </div>
  </div>
  <div class="space-y-8 pt-4 text-sm" v-if="false">
    <!-- general -->
    <div class="space-y-2">
      <div class="text-base">General</div>
      <div class="divide-y divide-gray-100">
        <div class="setting-item">
          <div class="text-gray-500">Network</div>
          <SelectNetwork />
        </div>

        <div class="setting-item group cursor-pointer" @click="toCurrentAccount">
          <div class="text-gray-500 group-hover:underline">Current Account</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item group cursor-pointer" @click="toAddressType">
          <div class="text-gray-500 group-hover:underline">BTC Address Type</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item group cursor-pointer" @click="toToolkit">
          <div class="text-gray-500 group-hover:underline">Toolkit</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item group cursor-pointer" @click="openWindowMode" v-if="!IS_DEV">
          <div class="text-gray-500 group-hover:underline">Open in Window Mode</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- security -->
    <div class="space-y-2">
      <div class="text-base">Security</div>

      <div class="divide-y divide-gray-100">
        <div class="setting-item group cursor-pointer" @click="toBackup" v-if="hasPassword">
          <div class="text-gray-500 group-hover:underline">Backup</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item group cursor-pointer" @click="setPassword" v-else>
          <div class="text-gray-500 group-hover:underline">Set Password</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item group cursor-pointer" @click="showResetModal = true" v-if="hasPassword">
          <div class="text-gray-500 group-hover:underline">Reset Account</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item group cursor-pointer" @click="toSecurityLab" v-if="false">
          <div class="text-gray-500 group-hover:underline">Security Lab (Upgrade to account V3 version)</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item group cursor-pointer" @click="toSecurityLab" v-if="false">
          <div class="text-gray-500 group-hover:underline">Migrate Error Logs</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div>

        <!-- <div class="setting-item group cursor-pointer" @click="toConnectedDapps">
          <div class="text-gray-500 group-hover:underline">Connected Dapps</div>
          <div>
            <ChevronRightIcon class="link-icon" />
          </div>
        </div> -->
      </div>
    </div>

    <!-- about -->
    <div class="space-y-2">
      <div class="text-base">About</div>
      <div class="divide-y divide-gray-100">
        <div class="setting-item group cursor-pointer" @click="toTerms">
          <div class="text-gray-500 group-hover:underline">Terms of Service</div>
          <div>
            <ArrowTopRightOnSquareIcon class="link-icon" />
          </div>
        </div>
        <div class="setting-item group cursor-pointer" @click="toPolicy">
          <div class="text-gray-500 group-hover:underline">Privacy Policy</div>
          <div>
            <ArrowTopRightOnSquareIcon class="link-icon" />
          </div>
        </div>
        <div class="setting-item group cursor-pointer" @click="toDiscord">
          <div class="text-gray-500 group-hover:underline">Get Help at Discord</div>
          <div>
            <ArrowTopRightOnSquareIcon class="link-icon" />
          </div>
        </div>
        <div class="setting-item group cursor-pointer" @click="toGithub">
          <div class="text-gray-500 group-hover:underline">Source Code at Github</div>
          <div>
            <ArrowTopRightOnSquareIcon class="link-icon" />
          </div>
        </div>

        <div class="setting-item">
          <div class="text-gray-500">Version</div>
          <div>{{ VERSION }}</div>
        </div>
      </div>
    </div>
  </div>

  <ResetModal v-model:show="showResetModal" />
</template>

<style lang="css" scoped>
.setting-item {
  @apply -mx-2 flex items-center justify-between px-2 py-4 transition-all duration-200 ease-in-out hover:bg-gray-300/20;
}

.link-icon {
  @apply h-4 w-4 text-gray-500 group-hover:text-blue-500;
}
</style>
