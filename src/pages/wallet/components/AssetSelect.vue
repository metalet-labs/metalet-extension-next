<script lang="ts" setup>
import { Switch } from '@headlessui/vue'
import { computed, ref, watch } from 'vue'
import { UseImage } from '@vueuse/components'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'
import { addAssetsDisplay, getAssetsDisplay, removeAssetsDisplay } from '@/lib/assets'
import { type Asset, type FTAsset, type MRC20Asset, type Tag, getTagInfo } from '@/data/assets'

const props = defineProps<{
  asset: Asset
  coinCategory: CoinCategory
}>()

const tag = ref<Tag>()
const asset = computed(() => props.asset)

const { getIcon } = useIconsStore()

if (props.asset?.contract) {
  tag.value = getTagInfo(props.asset.contract)
}

const icon = computed(
  () =>
    getIcon(
      props.coinCategory,
      props.coinCategory === CoinCategory.MetaContract ? (props.asset as FTAsset).genesis : props.asset.symbol
    ) ||
    (asset.value as MRC20Asset)?.icon ||
    ''
)

const enabled = ref(false)
const initializing = ref(true)
getAssetsDisplay().then((assets) => {
  enabled.value = assets.includes(props.asset.symbol)
  initializing.value = false
})

watch(enabled, async (value) => {
  if (initializing.value) return

  if (value) {
    await addAssetsDisplay(props.asset.symbol)
  } else {
    await removeAssetsDisplay(props.asset.symbol)
  }
})
</script>

<template>
  <div class="flex items-center justify-between rounded px-4 py-6">
    <div class="flex items-center gap-x-3">
      <UseImage :src="icon" class="h-10 w-10 rounded-md">
        <template #loading>
          <div class="h-10 w-10 text-center leading-10 rounded-full text-white text-base bg-btn-blue">
            {{ asset.symbol[0].toLocaleUpperCase() }}
          </div>
        </template>
        <template #error>
          <div class="text-center leading-10 rounded-full text-white text-base bg-btn-blue">
            {{ asset.symbol[0].toLocaleUpperCase() }}
          </div>
        </template>
      </UseImage>
      <div class="flex flex-col items-start">
        <div class="text-base">{{ asset.tokenName }}</div>
        <div
          v-if="tag"
          :style="`background-color:${tag.bg};color:${tag.color};`"
          :class="['px-1.5 py-0.5 rounded text-xs origin-left w-auto inline scale-75']"
        >
          {{ tag.name }}
        </div>
      </div>
    </div>

    <!-- toggle -->
    <Switch
      v-model="enabled"
      :class="enabled ? 'bg-blue-primary' : 'bg-gray-50 shadow-inner'"
      class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
    >
      <span
        aria-hidden="true"
        :class="enabled ? 'translate-x-6' : 'translate-x-0'"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
      />
    </Switch>
  </div>
</template>
