<script setup lang="ts">
import { computed, ref } from 'vue'
import { toTx } from '@/lib/helpers'
import { PopCard } from '@/components'
import { network } from '@/lib/network'
import Copy from '@/components/Copy.vue'
import { LoadingText } from '@/components'
import { getBrowserHost } from '@/lib/host'
import { UseImage } from '@vueuse/components'
import { useRoute, useRouter } from 'vue-router'
import { useMetaPinQuery } from '@/queries/metaPin'
import BtcIcon from '@/assets/icons-v3/network_btc.svg'
import MvcIcon from '@/assets/icons-v3/network_mvc.svg'
import { formatTimestamp, shortestAddress, prettifyTxId, prettifyTokenGenesis } from '@/lib/formatters'

const router = useRouter()
const { params } = useRoute()

const address = params.address as string
const metaPinId = ref(params.metaPinId as string)

const { data: metaPin, isLoading } = useMetaPinQuery(metaPinId, { enabled: computed(() => !!address) })

const toSendNFT = (id: string) => {
  router.push({
    name: 'sendNFT',
    params: { id, nftType: 'metaPin' },
    query: {
      satoshis: metaPin.value?.outputValue,
      content: metaPin.value?.contentSummary,
      imgUrl:
        metaPin.value?.contentType.includes('image') || metaPin.value?.contentTypeDetect.includes('image')
          ? metaPin.value?.content
          : undefined,
    },
  })
}

const getHostAndToTx = async (txId: string) => {
  const host = await getBrowserHost('btc')
  toTx(txId, host as string)
}

const imageSrc = computed(() => {
  if (!metaPin.value) return ''
  try {
    const contentSummary = JSON.parse(metaPin.value?.contentSummary)
    return contentSummary.attachment[0].content.replace(
      'metafile://',
      `https://man${network.value === 'testnet' ? '-test' : ''}.metaid.io/content/`
    )
  } catch (error) {
    return ''
  }
})
</script>

<template>
  <LoadingText text="MetaID PIN Detail Loading..." v-if="isLoading" />
  <div class="w-full space-y-4" v-else-if="metaPin">
    <div class="w-full flex items-center justify-center">
      <div
        :class="[
          { 'p-2 bg-blue-primary': !imageSrc },
          'size-[220px] flex items-center justify-center rounded-xl relative text-white',
        ]"
      >
        <img
          alt=""
          :src="imageSrc"
          v-if="imageSrc"
          class="w-full h-full border-2 border-gray-soft rounded-xl object-contain"
        />
        <div class="overflow-hidden line-clamp-6 break-all" v-else>{{ metaPin.contentSummary }}</div>

        <span
          :title="`${metaPin.outputValue} sat`"
          :class="[
            'absolute rounded right-3 bottom-3 py-3px px-1.5 text-xs',
            metaPin.contentTypeDetect.includes('image')
              ? 'bg-[#EBECFF] text-[#787FFF]'
              : 'bg-[rgb(235,236,255,0.2) text-[#EBECFF]',
          ]"
        >
          {{ metaPin.outputValue }} sat
        </span>
      </div>
    </div>
    <div class="flex items-center justify-center text-lg">
      <span v-if="metaPin.number !== -1"># {{ metaPin.number }}</span>
      <span v-else>Unconfirmed</span>
    </div>

    <div class="flex justify-center">
      <button
        @click="toSendNFT(metaPin!.id)"
        :disabled="metaPin.status === -9"
        :class="[
          'w-30 rounded-3xl py-4 text-center text-ss text-blue-primary bg-blue-light mx-auto ',
          { 'cursor-pointer': metaPin.status === 0 },
          { 'opacity-50 cursor-not-allowed': metaPin.status === -9 },
        ]"
      >
        Transfer
      </button>
    </div>
    <div class="space-y-4 border-t border-gray-secondary pt-4">
      <div class="row">
        <div class="label">Creator</div>
        <div class="flex flex-col items-end gap-1">
          <div class="flex items-center gap-1">
            <UseImage :src="metaPin.avatar" class="size-5 rounded-md">
              <template #loading>
                <div class="size-5 text-center leading-5 rounded-full text-white text-base bg-btn-blue">
                  {{ (metaPin.creator?.[0] || metaPin.metaid?.[0]).toLocaleUpperCase() }}
                </div>
              </template>
              <template #error>
                <div class="size-5 text-center leading-5 rounded-full text-white text-base bg-btn-blue">
                  {{ (metaPin.creator?.[0] || metaPin.metaid?.[0]).toLocaleUpperCase() }}
                </div>
              </template>
            </UseImage>
            <span class="text-sm">{{ metaPin.creator ? shortestAddress(metaPin.creator, 6) : 'User' }}</span>
          </div>
          <span class="text-sm text-gray-primary">{{ prettifyTxId(metaPin.metaid, 3) }}</span>
        </div>
      </div>
      <div class="row">
        <div class="label">Level</div>
        <PopCard :level="metaPin.popLv" />
      </div>
      <div class="row">
        <div class="label">Pop</div>
        <div :title="metaPin.id">
          {{ prettifyTxId(metaPin.pop) }}
        </div>
      </div>
      <div class="row">
        <div class="label">Network</div>
        <div class="flex items-center gap-1">
          <BtcIcon class="w-4.5" v-if="metaPin.chainName === 'btc'" />
          <MvcIcon class="w-4.5" v-if="metaPin.chainName === 'mvc'" />
          <span class="text-sm">{{ metaPin.chainName }}</span>
        </div>
      </div>
      <div class="row">
        <span class="label">ID</span>
        <div :title="metaPin.id" class="flex items-center gap-x-1">
          {{ prettifyTxId(metaPin.id) }}
          <Copy :text="metaPin.id!" :title="$t('CopiedText.MetaPinIDCopiedText')" :show-content="true" />
        </div>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.Address') }}</span>
        <div :title="address">
          {{ shortestAddress(address, 6) }}
        </div>
      </div>
      <div class="row">
        <span class="label">Output value:</span>
        <div>
          {{ metaPin.outputValue }}
        </div>
      </div>
      <div class="row">
        <span class="label">Preview</span>
        <a
          target="_blank"
          :href="metaPin.preview"
          :title="metaPin.preview"
          class="w-52 truncate text-[#5173B9] underline"
        >
          {{ metaPin.preview }}
        </a>
      </div>
      <div class="row">
        <span class="label">Content</span>
        <a
          target="_blank"
          :href="metaPin.content"
          :title="metaPin.content"
          class="w-52 truncate text-[#5173B9] underline"
        >
          {{ metaPin.content }}
        </a>
      </div>
      <div class="row">
        <span class="label">Content Length</span>
        <span>{{ metaPin.contentLength }}</span>
      </div>
      <div class="row">
        <span class="label">Content Type</span>
        <span>{{ metaPin.contentType }}</span>
      </div>
      <div class="row">
        <span class="label">Path</span>
        <div class="w-52 truncate text-right" :title="metaPin.path">{{ metaPin.path }}</div>
      </div>
      <div class="row">
        <span class="label">Timestamp</span>
        <div>{{ formatTimestamp(metaPin.timestamp) }}</div>
      </div>
      <div class="row">
        <span class="label">Genesis Transaction</span>
        <div
          @click="getHostAndToTx(metaPin!.genesisTransaction)"
          class="text-right w-52 truncate text-[#5173B9] underline cursor-pointer"
          :title="metaPin.genesisTransaction"
        >
          {{ prettifyTokenGenesis(metaPin.genesisTransaction) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.row {
  @apply flex items-center justify-between;
}

.title {
  font-size: 14px;
  color: #909399;
  font-weight: bold;
}
</style>
