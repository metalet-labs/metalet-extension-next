<script setup lang="ts">
import { toTx } from '@/lib/helpers'
import { PopCard } from '@/components'
import Copy from '@/components/Copy.vue'
import { LoadingText } from '@/components'
import { computed, ref } from 'vue'
import { getBrowserHost } from '@/lib/host'
import { UseImage } from '@vueuse/components'
import { useRoute, useRouter } from 'vue-router'
import BtcIcon from '@/assets/icons-v3/network_btc.svg'
import MvcIcon from '@/assets/icons-v3/network_mvc.svg'
import { formatTimestamp, shortestAddress, prettifyTxId, prettifyTokenGenesis } from '@/lib/formatters'
import { getMetaFileUrl } from '@/lib/mrc721'
import { useMRC721ItemQuery } from '@/queries/mrc721'

const router = useRouter()
const { params } = useRoute()

const address = params.address as string
const metaPinId = ref(params.metaPinId as string)

const { data: metaPin, isLoading } = useMRC721ItemQuery(metaPinId.value)

const imageSrc = computed(() => {
  try {
    if (!metaPin.value?.contentString) return ''
    return getMetaFileUrl(metaPin.value.contentString)
  } catch (error) {
    console.error('Error getting image URL:', error)
    return ''
  }
})

const toSendNFT = (id: string) => {
  router.push({
    name: 'sendNFT',
    params: { id, nftType: 'metaPin' },
    query: {
      satoshis: metaPin.value?.outValue,
      content: metaPin.value?.desc,
      imgUrl: imageSrc.value,
    },
  })
}

const getHostAndToTx = async (txId: string) => {
  const host = await getBrowserHost('btc')
  toTx(txId, host as string)
}
</script>

<template>
  <LoadingText :text="$t('Common.DetailLoading')" v-if="isLoading" />
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
        <div class="overflow-hidden line-clamp-6 break-all" v-else>{{ metaPin.desc }}</div>

        <span
          :title="`${metaPin.outValue} sat`"
          class="absolute rounded right-3 bottom-3 py-3px px-1.5 bg-[#E2F4FF]/80 text-[#1472FF] text-xs scale-75"
        >
          {{ metaPin.outValue }} sat
        </span>
      </div>
    </div>
    <div class="flex items-center justify-center text-lg">
      <span v-if="metaPin.itemPinNumber !== -1"># {{ metaPin.itemPinNumber }}</span>
      <span v-else>{{ $t('Common.Unconfirmed') }}</span>
    </div>

    <div class="flex justify-center">
      <button
        @click="toSendNFT(metaPin!.itemPinId)"
        class="w-30 rounded-3xl py-4 text-center text-ss text-blue-primary bg-blue-light mx-auto cursor-pointer"
      >
        {{ $t('Common.Transfer') }}
      </button>
    </div>
    <div class="space-y-4 border-t border-gray-secondary pt-4">
      <div class="row">
        <div class="label">{{ $t('Common.Creator') }}</div>
        <div class="flex flex-col items-end gap-1">
          <div class="flex items-center gap-1">
            <UseImage :src="metaPin.cover" class="size-5 rounded-md">
              <template #loading>
                <div class="size-5 text-center leading-5 rounded-full text-white text-base bg-btn-blue">
                  {{ (metaPin.metaId?.[0] || 'U').toLocaleUpperCase() }}
                </div>
              </template>
              <template #error>
                <div class="size-5 text-center leading-5 rounded-full text-white text-base bg-btn-blue">
                  {{ (metaPin.metaId?.[0] || 'U').toLocaleUpperCase() }}
                </div>
              </template>
            </UseImage>
            <span class="text-sm">{{ shortestAddress(metaPin.address, 6) }}</span>
          </div>
          <span class="text-sm text-gray-primary">{{ prettifyTxId(metaPin.metaId, 6) }}</span>
        </div>
      </div>
      <div class="row">
        <div class="label">{{ $t('Common.Level') }}</div>
        <PopCard :level="1" />
      </div>
      <div class="row">
        <div class="label">{{ $t('Common.Pop') }}</div>
        <div :title="metaPin.outpoint">
          {{ prettifyTxId(metaPin.outpoint.split(':')[0]) }}
        </div>
      </div>
      <div class="row">
        <div class="label">{{ $t('Common.Network') }}</div>
        <div class="flex items-center gap-1">
          <BtcIcon class="w-5" v-if="metaPin.chain.toLowerCase() === 'btc'" />
          <MvcIcon class="w-5" v-if="metaPin.chain.toLowerCase() === 'mvc'" />
          <span class="text-sm">{{ metaPin.chain }}</span>
        </div>
      </div>
      <div class="row">
        <div class="label">{{ $t('Common.Collection') }}</div>
        <div class="text-sm">{{ metaPin.collectionName }}</div>
      </div>
      <div class="row">
        <div class="label">{{ $t('Common.ID') }}</div>
        <div :title="metaPin.itemPinId" class="flex items-center gap-x-1">
          {{ prettifyTxId(metaPin.itemPinId) }}
          <Copy :text="metaPin.itemPinId" :title="$t('CopiedText.MetaPinIDCopiedText')" :show-content="true" />
        </div>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.Address') }}</span>
        <div :title="address">
          {{ shortestAddress(address, 6) }}
        </div>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.OutputValue') }}</span>
        <div>
          {{ metaPin.outValue }}
        </div>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.Preview') }}</span>
        <a
          target="_blank"
          :href="imageSrc"
          :title="imageSrc"
          class="w-52 truncate text-[#5173B9] underline"
        >
          {{ imageSrc }}
        </a>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.Content') }}</span>
        <a
          target="_blank"
          :href="metaPin.contentString"
          :title="metaPin.contentString"
          class="w-52 truncate text-[#5173B9] underline"
        >
          {{ metaPin.contentString }}
        </a>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.ContentLength') }}</span>
        <span>{{ metaPin.content?.length || 0 }}</span>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.ContentType') }}</span>
        <span>{{ metaPin.contentType }}</span>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.ContentTypeDetect') }}</span>
        <span>{{ metaPin.contentTypeDetect }}</span>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.Path') }}</span>
        <div class="w-52 truncate text-right">/nft/mrc721/{{ metaPin.collectionName }}</div>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.Timestamp') }}</span>
        <div>{{ formatTimestamp(metaPin.createTime) }}</div>
      </div>
      <div class="row">
        <span class="label">{{ $t('Common.GenesisTransaction') }}</span>
        <div
          @click="getHostAndToTx(metaPin.outpoint.split(':')[0])"
          class="text-right w-52 truncate text-[#5173B9] underline cursor-pointer"
          :title="metaPin.outpoint"
        >
          {{ prettifyTokenGenesis(metaPin.outpoint.split(':')[0]) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.row {
  @apply flex items-center justify-between;
}

.label {
  @apply text-sm text-gray-primary;
}
</style>
