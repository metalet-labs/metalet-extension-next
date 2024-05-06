<script lang="ts" setup>
import { ref } from 'vue'
import connector from '@/lib/connector'
import { UseImage } from '@vueuse/components'
import { XMarkIcon } from '@heroicons/vue/16/solid'
import { getCurrentAccountId } from '@/lib/account'

const currentAccountId = ref()
const connections = ref<Array<{ host: string; logo?: string }>>([])

const getCurrentConnections = () => {
  connector.getCurrentConnections().then((_connections) => {
    connections.value = _connections
  })
}

getCurrentAccountId().then((accountId) => {
  currentAccountId.value = accountId
})

getCurrentConnections()
</script>

<template>
  <div class="flex flex-col min-h-full">
    <div v-if="!connections.length" class="my-8 test-sm text-center text-gray-primary">No Connected DApps.</div>
    <div class="grow" v-else>
      <div class="text-xs text-gray-primary">Connected DApps</div>
      <div v-for="connection in connections" class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <UseImage :src="connection.logo!" class="w-10 aspect-square">
            <template #loading>
              <div class="w-10 aspect-square flex items-center justify-center rounded-full text-white bg-blue-primary">
                {{ connection.host[0].toLocaleUpperCase() }}
              </div>
            </template>
            <template #error>
              <div class="w-10 aspect-square flex items-center justify-center rounded-full text-white bg-blue-primary">
                {{ connection.host[0].toLocaleUpperCase() }}
              </div>
            </template>
          </UseImage>
          <span class="font-bold">{{ connection.host }}</span>
        </div>
        <XMarkIcon
          class="w-5 cursor-pointer"
          @click="
            async () => {
              await connector.disconnect(currentAccountId, connection.host)
              await getCurrentConnections()
            }
          "
        />
      </div>
    </div>
    <div class="my-4 flex justify-center">
      <button
        v-if="connections.length"
        class="w-61.5 rounded-3xl py-3 bg-blue-primary text-center text-base text-white"
        @click="
          () => {
            for (let connection of connections) {
              connector.disconnect(currentAccountId, connection.host)
            }
            connections = []
          }
        "
      >
        Disconnect all
      </button>
    </div>
  </div>
</template>
