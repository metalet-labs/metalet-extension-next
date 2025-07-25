<script lang="ts" setup>
import Pay from './Pay.vue'
import Merge from './Merge.vue'
import Connect from './Connect.vue'
import { computed, ref } from 'vue'
import { toTx } from '@/lib/helpers'
import Inscribe from './Inscribe.vue'
import { DEBUG } from '@/data/config'
import { useRoute } from 'vue-router'
import Transfer from './Transfer.vue'
import MRC20Mint from './MRC20Mint.vue'
import Disconnect from './Disconnect.vue'
import BTCTransfer from './BTCTransfer.vue'
import SignBTCPsbt from './SignBtcPsbt.vue'
import SignMessage from './SignMessage.vue'
import MRC20Deploy from './MRC20Deploy.vue'
import EciesEncrypt from './EciesEncrypt.vue'
import EciesDecrypt from './EciesDecrypt.vue'
import actions from '@/data/authorize-actions'
import SwitchNetwork from './SwitchNetwork.vue'
import MRC20Transfer from './MRC20Transfer.vue'
import MRC20TransferWithInscribe from './MRC20TransferWithInscribe.vue'
import TransferToken from './TransferToken.vue'
import SignBTCMessage from './SignBTCMessage.vue'
import { LinkIcon } from '@heroicons/vue/20/solid'
import SignTransaction from './SignTransaction.vue'
import { Chain } from '@metalet/utxo-wallet-service'
import SignTransactions from './SignTransactions.vue'
import UnlockP2PKHInput from './UnlockP2PKHInput.vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { getBrowserHost } from '@/lib/host'

// 从query中获取数据
const route = useRoute()
const { host, actionName, nonce, tabId, icon } = route.query

const logo = computed(() => {
  if (icon) return icon as string

  return null
})

type ActionType = keyof typeof actions
const action = actions[actionName as ActionType]

const params: any = JSON.parse(route.query.params as string)

const exit = () => {
  if (!DEBUG) {
    window.close()
  }
}

const getHostAndToTx = async (txid: string) => {
  const host = await getBrowserHost()
  toTx(txid, host as string)
}

const running = ref(false)
const isFinished = ref(false)
const processTxids = ref([])
const runAction = async () => {
  running.value = true

  const process = action.process

  let processRes: any = null

  try {
    if (actionName === 'Connect') {
      params.logo = logo.value
      processRes = await process(params, host as string)
    } else {
      processRes = await process(params, host as string)
    }

    if (processRes.txids && processRes.broadcasted) {
      processTxids.value = processRes.txids
    }
  } catch (e: any) {
    processTxids.value = []
    processRes = {
      error: e.message,
    }
  } finally {
    running.value = false
    isFinished.value = true
  }

  // 发送消息给 content-script-tab
  const tab = (
    await chrome.tabs.query({
      active: true,
      windowType: 'normal',
    })
  ).find((tab) => tab.id === Number(tabId))
  if (tab?.id) {
    const response = {
      nonce,
      channel: 'from-metaidwallet',
      action: `respond-${actionName}`,
      host: host as string,
      res: processRes,
    }
    chrome.tabs.sendMessage(tab.id, response)
  }

  if ('closeAfterProcess' in action && action.closeAfterProcess) {
    exit()
  }
}

const cancelAction = async () => {
  // 发送消息给 content-script-tab
  const tab = (
    await chrome.tabs.query({
      active: true,
      windowType: 'normal',
    })
  ).find((tab) => tab.id === Number(tabId))
  if (tab?.id) {
    const response = {
      nonce,
      channel: 'from-metaidwallet',
      action: `respond-${actionName}`,
      host: host as string,
      res: {
        status: 'canceled',
      },
    }
    chrome.tabs.sendMessage(tab.id, response)
  }

  exit()
}
</script>

<template>
  <div class="flex h-full flex-col items-center overflow-y-auto">
    <!-- backdrop -->
    <div
      class="absolute inset-0 z-10 flex h-full w-full items-center justify-center rounded-lg bg-white/40 backdrop-blur"
      v-show="running"
    >
      <div>Processing...</div>
    </div>
    <div
      class="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center rounded-lg bg-white p-6"
      v-show="isFinished"
    >
      <div class="gradient-text text-base">Task Finished</div>

      <div class="mt-8 space-y-4 text-sm">
        <div v-for="txid in processTxids" :key="txid" class="space-y-1">
          <div class="label flex items-center gap-x-2">
            <div>Transaction ID</div>
            <button @click="getHostAndToTx(txid)" class="h-5 w-5">
              <ArrowTopRightOnSquareIcon class="h-5 w-5 hover:text-blue-primary" />
            </button>
          </div>
          <div class="value break-all">{{ txid }}</div>
        </div>
      </div>

      <div class="mt-8">
        <button class="main-btn-bg w-48 rounded-lg py-3 text-base text-sky-100" @click="exit">OK</button>
      </div>
    </div>

    <!-- header -->
    <div class="gradient-text mt-6 text-lg tracking-wide">AUTHORIZE</div>

    <!-- logo -->
    <div class="mt-4 flex h-24 w-24 items-center justify-center rounded-xl bg-gray-50 shadow-inner shadow-gray-300">
      <img class="w-full object-contain rounded-xl" :src="logo" alt="logo" v-if="logo" />
      <LinkIcon class="h-16 w-16 text-gray-300" v-else />
    </div>

    <!-- website -->
    <div class="mt-4 text-sm text-gray-500">{{ host }} would like to:</div>

    <!-- details -->
    <div class="my-4 grow self-stretch overflow-y-auto rounded-lg bg-gray-50 px-4 py-6 text-sm">
      <TransferToken v-if="actionName === 'TokenTransfer'" :params="params" />
      <Transfer v-if="actionName === 'Transfer'" :params="params" />
      <Connect v-if="actionName === 'Connect' || actionName === 'ConnectBTC'" />
      <Disconnect v-if="actionName === 'Disconnect'" />
      <Merge v-if="actionName === 'Merge'" />
      <SwitchNetwork v-if="actionName === 'SwitchNetwork'" />
      <EciesEncrypt v-if="actionName === 'EciesEncrypt'" :params="params" />
      <EciesDecrypt v-if="actionName === 'EciesDecrypt'" :params="params" />
      <SignTransaction v-if="actionName === 'SignTransaction'" :params="params" />
      <SignTransactions v-if="actionName === 'SignTransactions'" :params="params" />
      <UnlockP2PKHInput v-if="actionName === 'UnlockP2PKHInput'" :params="params" />
      <Pay v-if="actionName === 'Pay'" :params="params" />
      <SignBTCPsbt v-if="actionName === 'SignBTCPsbt'" :params="params" />
      <SignMessage v-if="actionName === 'SignMessage'" :params="params" />
      <SignBTCMessage v-if="actionName === 'SignBTCMessage'" :params="params" />
      <Inscribe v-if="actionName === 'Inscribe'" :params="params" />
      <BTCTransfer v-if="actionName === 'BTCTransfer'" :params="params" />
      <MRC20Deploy v-if="actionName === 'MRC20Deploy'" :params="params" />
      <MRC20Mint v-if="actionName === 'MRC20Mint'" :params="params" />
      <MRC20Transfer v-if="actionName === 'MRC20Transfer'" :params="params" />
      <MRC20TransferWithInscribe v-if="actionName === 'MRC20TransferWithInscribe'" :params="params" />
    </div>

    <!-- buttons -->
    <div class="flex items-center justify-center gap-2">
      <button class="w-30 rounded-3xl bg-blue-light py-4 text-ss text-blue-primary" @click="cancelAction">
        Cancel
      </button>
      <button class="w-30 rounded-3xl bg-blue-primary py-4 text-ss text-white" @click="runAction">{{ $t('Common.Confirm') }}</button>
    </div>
  </div>
</template>

<style lang="css" scoped>
:deep(.label) {
  @apply text-sm text-gray-500;
}

:deep(.value) {
  @apply break-all text-xs;
}
</style>
