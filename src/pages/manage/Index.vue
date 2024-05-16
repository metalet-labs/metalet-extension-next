<script setup lang="ts">
import { ref } from 'vue'
import { IS_DEV } from '@/data/config'
import { EditName } from '@/components'
import { type V3Wallet } from '@/lib/types'
import Avatar from '@/components/Avatar.vue'
import { totalBalance } from '@/lib/balance'
import { toast } from '@/components/ui/toast'
import AddIcon from '@/assets/icons-v3/add.svg'
import { goToTab, goToPage } from '@/lib/utils'
import { getBackupV3Wallet } from '@/lib/backup'
import { WalletsStore } from '@/stores/WalletStore'
import { Chain } from '@metalet/utxo-wallet-service'
import { notifyContent } from '@/lib/notify-content'
import PencilIcon from '@/assets/icons-v3/pencil.svg'
import { FlexBox, Divider, Button } from '@/components'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
import SuccessIcon from '@/assets/icons-v3/success-checked.svg'
import { useChainWalletsStore } from '@/stores/ChainWalletsStore'
import { getCurrentAccountId, setCurrentAccountId } from '@/lib/account'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { getCurrentWalletId, setV3WalletsStorage, getV3WalletsStorage, setCurrentWalletId } from '@/lib/wallet'

const { updateAllWallets, getAddress } = useChainWalletsStore()

const editName = ref()
const editWalletId = ref()
const editAccountId = ref()
const editNameOpen = ref(false)
const editNameType = ref<'Wallet' | 'Account'>('Wallet')

const walletObj = ref<Record<string, V3Wallet>>({})
const currentWalletId = ref<string>()
const currentAccountId = ref<string>()
const backupWallets = ref<string[]>([])

const btcAddress = getAddress(Chain.BTC)
const mvcAddress = getAddress(Chain.MVC)

getV3WalletsStorage().then(async (_wallets) => {
  walletObj.value = _wallets
})

getBackupV3Wallet().then((_backupWallets) => {
  backupWallets.value = _backupWallets
})

getCurrentWalletId().then((_currentWalletId) => {
  currentWalletId.value = _currentWalletId
})

getCurrentAccountId().then((_currentAccountId) => {
  currentAccountId.value = _currentAccountId
})

const addAccount = async (wallet: V3Wallet) => {
  const addressIndices = wallet.accounts.map((account) => account.addressIndex)
  const maxAddressIndex = Math.max(...addressIndices)
  const walletManager = await WalletsStore.getWalletManager()
  const account = walletManager!.addAccount(wallet.id, {
    addressIndex: maxAddressIndex + 1,
  })
  wallet.accounts.push(account)
  setV3WalletsStorage(walletObj.value)
  toast({ title: 'New account created', toastType: 'success' })
  currentAccountId.value = account.id
  await setCurrentAccountId(account.id)
}

const relaodAccout = async (_walletId: string, _accountId: string) => {
  if (currentWalletId.value === _walletId) {
    if (currentAccountId.value === _accountId) {
      return
    } else {
      currentAccountId.value = _accountId
      await setCurrentAccountId(_accountId)
    }
  } else {
    const wallets = await WalletsStore.getWallets()
    const wallet = wallets.find((wallet) => wallet.id === _walletId)
    if (!wallet) {
      await WalletsStore.addWalletOnlyAccount(_walletId, _accountId)
      WalletsStore.loadWalletOtherAccounts(_walletId, _accountId)
    }
    currentWalletId.value = _walletId
    currentAccountId.value = _accountId
    await setCurrentWalletId(_walletId)
    await setCurrentAccountId(_accountId)
  }
  await updateAllWallets()
  notifyContent('accountsChanged')({ mvcAddress: mvcAddress.value, btcAddress: btcAddress.value })
  goToPage('/wallet')
}

const updataWalletName = (walletId: string, walletName: string) => {
  editName.value = walletName
  editNameOpen.value = true
  editNameType.value = 'Wallet'
  editWalletId.value = walletId
}

const updataAccountName = (walletId: string, accountId: string, accountName: string) => {
  editName.value = accountName
  editNameOpen.value = true
  editNameType.value = 'Account'
  editWalletId.value = walletId
  editAccountId.value = accountId
}
</script>

<template>
  <div class="flex flex-col w-full -mt-3 relative h-full">
    <EditName
      v-model:open="editNameOpen"
      :type="editNameType"
      :name="editName"
      :walletId="editWalletId"
      :accountId="editAccountId"
    />
    <div class="flex items-center justify-between w-full h-15 shrink-0">
      <ArrowLeftIcon @click="$router.back()" class="w-3.5 cursor-pointer" />
      <RouterLink to="/edit/wallets" class="text-sm">Edit wallet</RouterLink>
    </div>
    <div class="flex flex-col grow overflow-hidden -mx-2">
      <div class="flex flex-col items-start justify-center gap-2 w-full py-6 px-2">
        <div class="text-gray-primary">Current Account Asset</div>
        <div class="font-bold text-[40px] leading-[50px]">$ {{ totalBalance.toFixed(2) }}</div>
      </div>
      <Divider />
      <div class="flex flex-col py-6 grow overflow-y-auto pl-2 pr-4 nicer-scrollbar">
        <Accordion
          collapsible
          type="single"
          class="w-full"
          :defaultValue="IS_DEV ? currentWalletId : undefined"
          :modelValue="IS_DEV ? undefined : currentWalletId"
          v-for="wallet in Object.values(walletObj)"
        >
          <AccordionItem :key="wallet.id" :value="wallet.id">
            <AccordionTrigger>
              <div class="flex items-center gap-2">
                <span>{{ wallet.name }}</span>
                <PencilIcon
                  class="w-3.5 hover:text-blue-primary"
                  @click.stop="updataWalletName(wallet.id, wallet.name)"
                />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <FlexBox
                ai="center"
                jc="between"
                :key="account.id"
                v-for="account in wallet.accounts"
                @click="relaodAccout(wallet.id, account.id)"
                :class="['h-15', account.id === currentAccountId ? 'cursor-not-allowed' : 'cursor-pointer']"
              >
                <FlexBox ai="center" :gap="3">
                  <Avatar :id="account.id" />
                  <span>{{ account.name }}</span>
                  <PencilIcon
                    class="w-3.5 hover:text-blue-primary cursor-pointer"
                    @click.stop="updataAccountName(wallet.id, account.id, account.name)"
                  />
                </FlexBox>
                <SuccessIcon v-show="account.id === currentAccountId" class="w-5 h-5" />
              </FlexBox>
              <FlexBox
                ai="center"
                :gap="3"
                class="h-15 cursor-pointer"
                @click="addAccount(wallet)"
                v-if="backupWallets.includes(wallet.id)"
              >
                <AddIcon class="w-[38px] h-[38px]" />
                <span>Add account</span>
              </FlexBox>
              <RouterLink
                to="/wallet/backup"
                v-else
                class="flex items-center justify-center gap-2 cursor-pointer text-red-primary bg-[#FFEFEF] w-full py-2 rounded-[60px] mt-2.5 text-ss font-medium"
              >
                Go to Backup
                <ArrowRightIcon class="w-4" />
              </RouterLink>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
    <Button type="primary" @click="goToTab('/welcome', true)" class="w-61.5 mx-auto shrink-0 mt-3">Add Wallet</Button>
  </div>
</template>

<style scoped lang="css"></style>
