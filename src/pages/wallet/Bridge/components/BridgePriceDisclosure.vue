<script setup lang="ts">
import { ref } from 'vue'
import Decimal from 'decimal.js'
import { ChevronDownIcon } from 'lucide-vue-next'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'

const props = defineProps({
  token1Symbol: {
    type: String,
    required: true,
  },
  token2Symbol: {
    type: String,
    required: true,
  },
  calculating: {
    type: Boolean,
    default: false,
  },
  serviceFee: {
    type: String,
    required: false,
  },
  networkFee: {
    type: String,
    required: false,
  },
  decimal: {
    type: Number,
    required: false,
  },
  symbol: {
    type: String,
    required: false,
  },
})

const serviceFee = ref(new Decimal(props.serviceFee || 0).toFixed(props.decimal || 0))
const networkFee = ref(new Decimal(props.networkFee || 0).toFixed(props.decimal || 0))
const totalFee = ref(new Decimal(props.networkFee || 0).add(props.serviceFee || 0).toFixed(props.decimal || 0))
</script>

<template>
  <div class="">
    <Disclosure v-slot="{ open }" as="div" :default-open="true" class="mt-2 rounded-2xl border border-gray-soft p-4">
      <div class="text-zinc-500" v-if="calculating">Calculating...</div>
      <template v-else>
        <DisclosureButton class="flex w-full items-center justify-between text-xs focus:outline-none lg:text-sm">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <div class="">{{ `1 ${token1Symbol}` }}</div>
              <div>≈</div>
              <div class="">
                {{ `1 ${token2Symbol}` }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="">{{ `1 ${token2Symbol}` }}</div>
              <div>≈</div>
              <div class="">
                {{ `1 ${token1Symbol}` }}
              </div>
            </div>
          </div>

          <ChevronDownIcon class="h-5 w-5 text-zinc-500 duration-200" :class="{ 'rotate-180 transform': open }" />
        </DisclosureButton>

        <div v-if="open">
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-y-1 opacity-0 "
            enter-to-class="translate-y-0 opacity-100 "
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-y-0 opacity-100 "
            leave-to-class="translate-y-1 opacity-0 "
          >
            <DisclosurePanel class="mt-4 flex flex-col gap-2 border-t border-gray-soft pt-4 text-xs lg:text-sm" static>
              <div class="flex w-full items-center justify-between">
                <span class="label">Service fee</span>
                <div class="text-right text-xs text-zinc-500 lg:text-sm" v-if="serviceFee">
                  {{ `${serviceFee} ${symbol}` }}
                </div>
              </div>

              <div class="flex w-full items-center justify-between">
                <span class="label">Network fee</span>
                <div class="text-right text-xs text-zinc-500 lg:text-sm" v-if="networkFee">
                  {{ `${networkFee} ${symbol}` }}
                </div>
              </div>

              <div class="flex w-full items-center justify-between">
                <span class="label">Total fee</span>
                <div class="text-right text-xs text-zinc-500 lg:text-sm" v-if="totalFee">
                  {{ `${totalFee} ${symbol}` }}
                </div>
              </div>
            </DisclosurePanel>
          </transition>
        </div>
      </template>
    </Disclosure>
  </div>
</template>

<style scoped>
.label {
  @apply text-zinc-500;
}

.value {
  @apply text-zinc-300;
}
</style>
