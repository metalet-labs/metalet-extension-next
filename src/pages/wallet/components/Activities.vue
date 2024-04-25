<script lang="ts" setup>
import { ref, computed } from 'vue'
import { type Asset } from '@/data/assets'
import { LoadingText } from '@/components'
import ActivityItem from './ActivityItem.vue'
import { useActivitiesQuery } from '@/queries/activities'
import NoActivitiesPNG from '@/assets/icons-v3/no_activities.png'

const props = defineProps<{
  address: string
  asset: Asset
  exchangeRate?: number
}>()

const address = computed(() => props.address)
const enabled = computed(() => !!address.value)

const { isLoading, data: activities } = useActivitiesQuery(address, props.asset, { enabled })
</script>

<template>
  <LoadingText v-if="isLoading" text="Activities Loading..." />

  <ActivityItem
    :asset="asset"
    :activity="activity"
    :key="activity.txid"
    v-else-if="activities?.length"
    v-for="activity in activities"
  />

  <div v-else class="flex flex-col items-center justify-center gap-y-2 pb-4 pt-8 text-center">
    <img :src="NoActivitiesPNG" alt="" />
    <div class="text-gray-primary mt-4 text-ss">No activities</div>
  </div>
</template>
