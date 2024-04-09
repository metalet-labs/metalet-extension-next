<script setup lang="ts">
import { ref } from 'vue'
import { sleep } from '@/lib/helpers'
import { goToPage } from '@/lib/utils'
import { type V3Wallet } from '@/lib/types'
import Avatar from '@/components/Avatar.vue'
import { totalBalance } from '@/lib/balance'
import { toast } from '@/components/ui/toast'
import AddIcon from '@/assets/icons-v3/add.svg'
import { WalletsStore } from '@/stores/WalletStore'
import { FlexBox, Divider, Button } from '@/components'
import ArrowLeftIcon from '@/assets/icons-v3/arrow-left.svg'
import SuccessIcon from '@/assets/icons-v3/success-checked.svg'
import { getCurrentAccountId, setCurrentAccountId } from '@/lib/account'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { getCurrentWalletId, setV3WalletsStorage, getV3WalletsStorage, setCurrentWalletId } from '@/lib/wallet'

const walletObj = ref<Record<string, V3Wallet>>({})
const currentWalletId = ref<string>()
const currentAccountId = ref<string>()

getV3WalletsStorage().then((_wallets) => {
  walletObj.value = _wallets
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
  // console.log(wallet.accounts, wallet.accounts.length)
  const account = walletManager!.addAccount(wallet.id, {
    addressIndex: maxAddressIndex + 1,
  })
  wallet.accounts.push(account)
  setV3WalletsStorage(walletObj.value)
  toast({ title: 'New account created', toastType: 'success' })
}

const relaodAccout = async (_walletId: string, _accountId: string) => {
  // console.log(_walletId, _accountId)

  currentWalletId.value = _walletId
  currentAccountId.value = _accountId
  await setCurrentWalletId(_walletId)
  await setCurrentAccountId(_accountId)
  await sleep(200)
  window.location.replace('/wallet')
}
</script>

<template>
  <FlexBox class="w-full -my-3 pb-24 relative h-full" d="col">
    <FlexBox class="w-full h-15" ai="center" jc="between">
      <ArrowLeftIcon @click="$router.push('/wallet')" class="cursor-pointer" />
      <RouterLink to="/" class="text-sm">Edit wallt</RouterLink>
    </FlexBox>
    <FlexBox class="flex-1 overflow-y-auto pr-4 -mr-4" d="col">
      <FlexBox class="w-full py-6" d="col" :gap="2" ai="center" jc="center">
        <div>Current Account Asset</div>
        <div class="font-bold text-[40px] leading-[50px]">$ {{ totalBalance.toFixed(2) }} USD</div>
      </FlexBox>
      <Divider />
      <FlexBox class="w-full py-[49px]" d="col">
        <Accordion
          collapsible
          type="single"
          class="w-full"
          :key="wallet.id"
          :default-value="currentWalletId"
          v-for="wallet in Object.values(walletObj)"
        >
          <AccordionItem :value="wallet.id">
            <AccordionTrigger class="">{{ wallet.name }}</AccordionTrigger>
            <AccordionContent>
              <FlexBox
                ai="center"
                jc="between"
                :key="account.id"
                class="h-15 cursor-pointer"
                v-for="account in wallet.accounts"
                @click="relaodAccout(wallet.id, account.id)"
              >
                <FlexBox ai="center" :gap="3">
                  <Avatar :id="account.id" />
                  <span>{{ account.name }}</span>
                </FlexBox>
                <SuccessIcon v-show="account.id === currentAccountId" />
              </FlexBox>
              <FlexBox ai="center" :gap="3" class="h-15 cursor-pointer" @click="addAccount(wallet)">
                <AddIcon class="w-[38px] h-[38px]"/>
                <span>Add account</span>
              </FlexBox>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </FlexBox>
      <Button
        type="primary"
        @click="goToPage('/welcome', true)"
        class="py-6 absolute bottom-6 w-61.5 left-1/2 -translate-x-1/2"
        >Add Wallet</Button
      >
    </FlexBox>
  </FlexBox>
</template>

<style scoped lang="css"></style>
