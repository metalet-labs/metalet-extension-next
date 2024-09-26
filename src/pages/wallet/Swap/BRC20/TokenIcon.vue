<script setup lang="ts">
import { UseImage } from '@vueuse/components'
import { CircleEllipsisIcon } from 'lucide-vue-next'
import { computed, inject, toRef } from 'vue'

import { idcoinDetailKey } from '@/data/keys'
import { getPreviewContentUrl } from '@/lib/helpers'
import { useIconsStore } from '@/stores/IconsStore'
import { CoinCategory } from '@/queries/exchange-rates'

const props = withDefaults(
  defineProps<{
    token: string
    class?: string
    wrapt?: boolean
    type?: 'brc' | 'rune' | 'idcoin' | 'btc' | false
    content?: string
  }>(),
  { wrapt: false }
)

const { getIcon } = useIconsStore()
// FIXME: Compatible with lowercase brc20 icon
const iconUrl = getIcon(CoinCategory.BRC20, props.token.toLocaleUpperCase())
const isRune = computed(() => props.type === 'rune')
const isIdcoin = computed(() => props.type === 'idcoin')
const idcoinDetail = inject(idcoinDetailKey, null)

const finalUrl = computed(() => {
  if (isIdcoin.value) {
    if (props.content === '') {
      return ''
    }

    if (props.content) {
      return getPreviewContentUrl(props.content)
    }
  }
  if (isIdcoin.value && (!idcoinDetail || !idcoinDetail.value || !idcoinDetail.value.deployerUserInfo?.avatar)) {
    // loading idcoin detail, return empty string temporarily
    return ''
  }

  if (isIdcoin.value && idcoinDetail && idcoinDetail.value && idcoinDetail.value.deployerUserInfo?.avatar) {
    const content = props.content ?? idcoinDetail.value.deployerUserInfo?.avatar
    return getPreviewContentUrl(content)
  }
  return iconUrl
})

const firstChar = computed(() => {
  if (!props.token) {
    return ''
  }
  return toRef(props.token).value.charAt(0).toUpperCase()
})

const coinColor = computed(() => {
  if (isRune.value) {
    return 'bg-teal-900 text-teal-100 border-teal-500'
  }

  if (isIdcoin.value) {
    return 'bg-lime-900 text-lime-100 border-idcoin'
  }

  return 'bg-black'
})
</script>

<template>
  <UseImage :src="finalUrl!" :class="props.class + ' shrink-0 rounded-full '">
    <template #loading>
      <CircleEllipsisIcon
        :class="['shrink-0 rounded-full bg-black text-zinc-500', isRune ? 'bg-teal-900' : 'bg-black', props.class]"
      />
    </template>

    <template #error>
      <div
        :class="[
          'flex shrink-0 items-center justify-center rounded-full border-2 p-px text-base font-bold',
          coinColor,
          props.class,
        ]"
      >
        <div class="">
          {{ firstChar }}
        </div>
      </div>
    </template>
  </UseImage>
</template>
