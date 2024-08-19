<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import AssetLogo from '@/components/AssetLogo.vue'
import { assetReqReturnType } from '@/queries/types/bridge'
import { CheckIcon, ChevronDownIcon } from 'lucide-vue-next'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'

const props = defineProps<{
  bridgePairs?: assetReqReturnType[]
}>()

const codeHash = defineModel('codeHash', { type: String })
const genesis = defineModel('genesis', { type: String })

const bridgePairs = computed(() => props.bridgePairs)
const selectedPair = ref(bridgePairs.value?.[0])

function selectBridgePair(pairId: string) {
  const pair = bridgePairs.value?.find((p) => p.originTokenId === pairId)
  if (pair) {
    selectedPair.value = pair
    codeHash.value = pair.targetTokenCodeHash
    genesis.value = pair.targetTokenGenesis
  }
}

watch(
  bridgePairs,
  (newData) => {
    if (newData && newData.length > 0) {
      selectedPair.value = newData[0]
      codeHash.value = newData[0].targetTokenCodeHash
      genesis.value = newData[0].targetTokenGenesis
    }
  },
  { immediate: true }
)
</script>

<template>
  <Listbox
    as="div"
    v-if="bridgePairs && selectedPair"
    class="relative inline-block text-left"
    :model-value="selectedPair?.originTokenId"
    @update:model-value="selectBridgePair"
  >
    <div>
      <ListboxButton
        class="inline-flex w-full items-center justify-center gap-x-1.5 bg-gray-secondary rounded-full px-3 py-1.5 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-opacity-80"
        v-slot="{ open }"
      >
        <div class="flex">
          <AssetLogo :symbol="selectedPair.originSymbol" class="size-5 text-xs" />
          <AssetLogo :symbol="selectedPair.targetSymbol" class="size-5 text-xs -ml-2" />
        </div>

        <span v-if="selectedPair.network !== 'RUNES'" class="font-bold ml-1 text-left uppercase text-blue-primary">
          ${{ selectedPair.originSymbol }}-{{ selectedPair.targetSymbol }}
        </span>

        <ChevronDownIcon
          :class="['h-5 w-5 transform text-black duration-200', open && 'rotate-180']"
          aria-hidden="true"
        />
      </ListboxButton>
    </div>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <ListboxOptions
        class="nicer-scrollbar absolute left-0 z-50 mt-2 max-h-[75vh] origin-top-left overflow-auto rounded-md bg-gray-secondary shadow-lg ring-1 ring-gray-secondary ring-opacity-5 focus:outline-none"
      >
        <ListboxOption
          v-slot="{ active, selected }"
          v-for="pair in bridgePairs"
          :key="pair.originTokenId"
          :value="pair.originTokenId"
        >
          <button :class="['flex w-max min-w-full items-center p-4 text-xs', active && 'bg-white']">
            <div class="flex">
              <AssetLogo :symbol="selectedPair.originSymbol" class="size-5 text-xs" />
              <AssetLogo :symbol="selectedPair.targetSymbol" class="size-5 text-xs -ml-2" />
            </div>

            <div class="relative">
              <span :class="['ml-2 font-bold uppercase', selected && 'text-blue-primary']">
                ${{ pair.originSymbol }}-{{ pair.targetSymbol }}
              </span>
            </div>

            <CheckIcon v-if="selected" class="ml-4 h-5 w-5 text-primary" aria-hidden="true" />
          </button>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
