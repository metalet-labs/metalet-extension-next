<script setup lang="ts">
import { ref } from 'vue'
import { EditName } from '@/components'
import { DeleteWallet } from '@/components'
import { type V3Wallet } from '@/lib/types'
import Avatar from '@/components/Avatar.vue'
import { goToPage, goToTab } from '@/lib/utils'
import { getBackupV3Wallet } from '@/lib/backup'
import { WalletsStore } from '@/stores/WalletStore'
import RemoveIcon from '@/assets/icons-v3/remove.svg'
import PencilIcon from '@/assets/icons-v3/pencil.svg'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { getCurrentAccountId, setCurrentAccountId } from '@/lib/account'
import {
  deleteV3Wallet,
  getCurrentWalletId,
  setCurrentWalletId,
  getV3EncryptedWallets,
  getV3EncryptedWalletsStorage,
} from '@/lib/wallet'

const editName = ref()
const editAccountId = ref()
const editWalletId = ref('')
const editNameOpen = ref(false)
const deleteWalletOpen = ref(false)
const currentWalletId = ref<string>()
const currentAccountId = ref<string>()
const backupWallets = ref<string[]>([])
const walletObj = ref<Record<string, V3Wallet>>({})
const editNameType = ref<'Wallet' | 'Account'>('Wallet')

const { updateAllWallets } = useChainWalletsStore()

const getWallets = async () => {
  walletObj.value = await getV3EncryptedWalletsStorage()
}

getWallets()

getBackupV3Wallet().then((_backupWallets) => {
  backupWallets.value = _backupWallets
})

getCurrentWalletId().then((_currentWalletId) => {
  currentWalletId.value = _currentWalletId
})

getCurrentAccountId().then((_currentAccountId) => {
  currentAccountId.value = _currentAccountId
})

const reloadAccount = async (_walletId: string, _accountId: string) => {
  currentWalletId.value = _walletId
  currentAccountId.value = _accountId
  await setCurrentWalletId(_walletId)
  await setCurrentAccountId(_accountId)
  updateAllWallets()
  goToPage('/wallet')
}

const updateWalletName = (walletId: string, walletName: string) => {
  editName.value = walletName
  editNameOpen.value = true
  editNameType.value = 'Wallet'
  editWalletId.value = walletId
}

const updateAccountName = (walletId: string, accountId: string, accountName: string) => {
  editName.value = accountName
  editNameOpen.value = true
  editNameType.value = 'Account'
  editWalletId.value = walletId
  editAccountId.value = accountId
}

const deleteWallet = async (walletId: string) => {
  await deleteV3Wallet(walletId)
  const wallets = await getV3EncryptedWallets()
  if (wallets.length) {
    await setCurrentWalletId(wallets[0].id)
    await setCurrentAccountId(wallets[0].accounts[0].id)
    getWallets()
    deleteWalletOpen.value = false
  } else {
    WalletsStore.resetManager()
    goToTab('/welcome', true)
  }
}
</script>

<template>
  <div class="flex flex-col w-full -mt-3 relative h-full">
    <DeleteWallet v-model:open="deleteWalletOpen" :name="editName" :confirm="() => deleteWallet(editWalletId)" />
    <EditName
      :name="editName"
      :type="editNameType"
      :walletId="editWalletId"
      :accountId="editAccountId"
      v-model:open="editNameOpen"
    />
    <div class="flex items-center justify-end w-full h-15 shrink-0">
      <div @click="$router.go(-1)" class="text-sm cursor-pointer text-blue-primary">Done</div>
    </div>
    <div class="flex flex-col grow pr-2 -mr-2 overflow-hidden overflow-y-auto nicer-scrollbar -mb-3">
      <div class="flex flex-col w-full">
        <div class="w-full" v-for="wallet in Object.values(walletObj)">
          <div class="flex items-center gap-2 w-full h-15" :key="wallet.id" :value="wallet.id">
            <RemoveIcon
              class="cursor-pointer"
              @click="
                () => {
                  deleteWalletOpen = true
                  editName = wallet.name
                  editWalletId = wallet.id
                }
              "
            />
            <span>{{ wallet.name }}</span>
            <PencilIcon class="w-3.5 hover:text-blue-primary" @click.stop="updateWalletName(wallet.id, wallet.name)" />
            <EllipsisHorizontalIcon class="w-8 font-bold ml-auto cursor-pointer" v-if="false" />
          </div>
          <div>
            <div
              :key="account.id"
              class="h-15 cursor-pointer flex items-center justify-between"
              v-for="account in wallet.accounts"
              @click="reloadAccount(wallet.id, account.id)"
            >
              <div class="flex items-center gap-3">
                <Avatar :id="account.id" />
                <span>{{ account.name }}</span>
                <PencilIcon
                  class="w-3.5 hover:text-blue-primary"
                  @click.stop="updateAccountName(wallet.id, account.id, account.name)"
                />
              </div>
              <EllipsisHorizontalIcon class="w-8 font-bold cursor-pointer" v-if="false" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css"></style>
