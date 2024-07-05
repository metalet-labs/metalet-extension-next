<script lang="ts" setup>
import { ref, computed } from 'vue'
import { type Asset } from '@/data/assets'
import { LoadingText } from '@/components'
import ActivityItem from './ActivityItem.vue'
import { useActivitiesQuery } from '@/queries/activities'
import NoActivitiesPNG from '@/assets/icons-v3/no_activities.png'
import { CoinCategory } from '@/queries/exchange-rates'

const props = defineProps<{
  asset: Asset
  address: string
  exchangeRate?: number
  coinCategory: CoinCategory
}>()

const address = computed(() => props.address)
const enabled = computed(() => !!address.value)

const { isLoading, data: activities } = useActivitiesQuery(address, props.asset, { enabled })
</script>

<template>
  <LoadingText v-if="isLoading" text="Activities Loading..." />
  <div v-else-if="activities?.length">
    <ActivityItem
      :asset="asset"
      :key="activity.txid"
      :activity="activity"
      :coinCategory="coinCategory"
      v-for="activity in activities"
    />
  </div>

  <div v-else class="flex flex-col items-center justify-center gap-y-2 pb-4 pt-8 text-center">
    <img :src="NoActivitiesPNG" alt="" />
    <div class="text-gray-primary mt-4 text-ss">No activities</div>
  </div>
</template>
