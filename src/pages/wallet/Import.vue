<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { addAccount } from '@/lib/account'
import passwordManager from '@/lib/password'
import { ref, computed, Ref, watch } from 'vue'
import MetaletLogoImg from '@/assets/images/metalet-logo-v3.svg?url'
import { deriveAllAddresses, scripts, AddressType } from '@/lib/bip32-deriver'
import { TrashIcon, CheckIcon, ChevronUpDownIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import {
  Switch,
  SwitchLabel,
  SwitchGroup,
  RadioGroup,
  RadioGroupOption,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

// Remove the last one
const selectableScripts = scripts.slice(0, -1)
const selectedScript = ref(selectableScripts[0])

// 12/24个单词
const wordsLengths = [12, 24]
const selectedWordsLength = ref(12)
watch(
  () => selectedWordsLength.value,
  () => {
    clearWords()
    words.value = Array(selectedWordsLength.value).fill('')
  }
)
const words: Ref<string[]> = ref(Array(selectedWordsLength.value).fill(''))

const clearWords = () => {
  words.value = Array(selectedWordsLength.value).fill('')
}
const onPasteWords = (e: ClipboardEvent) => {
  const text = e.clipboardData?.getData('text')
  if (text) {
    const wordsArr = text.split(' ')
    if (wordsArr.length === selectedWordsLength.value) {
      words.value = wordsArr
    } else {
      error.value = t('WelcomePage.InvalidPhraseTips')
    }
  }
}

const pathDepth = ref('10001')
const useSamePath = ref(true)

const finished = computed(() => words.value.every((word) => word.length > 0))

const error = ref('')
const onSubmit = async () => {
  if (!finished.value) return false

  // 拼接助记词
  const mnemonicStr = words.value.join(' ')

  // 转化成私钥
  try {
    const fullPath = `m/44'/${pathDepth.value}'/0'/0/0`
    const btcPath = useSamePath.value ? fullPath : selectedScript.value.path

    const allAddresses = deriveAllAddresses({
      mnemonic: mnemonicStr,
      btcPath,
      mvcPath: fullPath,
    })

    // construct new account object
    const account = {
      mnemonic: mnemonicStr,
      assetsDisplay: ['SPACE', 'BTC'],
      mvc: {
        path: fullPath,
        addressType: AddressType.P2PKH,
        mainnetAddress: allAddresses.mvcMainnetAddress,
        testnetAddress: allAddresses.mvcTestnetAddress,
      },
      btc: {
        path: btcPath,
        addressType: useSamePath.value ? AddressType.P2PKH : selectedScript.value.addressType,
        mainnetAddress: allAddresses.btcMainnetAddress,
        testnetAddress: allAddresses.btcTestnetAddress,
      },
    }

    await addAccount(account)

    const hasPassword = await passwordManager.has()
    const following = hasPassword ? '/wallet' : '/wallet/set-password'
    router.push(following)
  } catch (e) {
    console.log(e)
    error.value = 'Failed to import your wallet'
  }
}
</script>

<template>
  <div class="mt-4">
    <div class="relative">
      <img class="mx-auto h-20 w-20" :src="MetaletLogoImg" alt="metalet-logo" />
    </div>
    <div class="mt-8 space-y-2">
      <h3 class="text-center text-2xl">Import your wallet</h3>

      <p class="text-center text-sm text-gray-500">
        Enter your multi-word secret phrase to import your existing wallet
      </p>
    </div>

    <!-- words -->
    <div class="mt-12">
      <h3 class="mb-3 flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <span>SECRET PHRASE</span>
          <button @click="clearWords" title="clear">
            <TrashIcon class="h-4 w-4 text-gray-400 transition hover:text-blue-500" />
          </button>
        </div>

        <RadioGroup v-model="selectedWordsLength">
          <div class="flex items-center gap-x-2">
            <RadioGroupOption v-slot="{ checked }" :value="length" v-for="length of wordsLengths" class="rounded">
              <div
                :class="[
                  checked ? 'bg-blue-100 text-blue-500' : 'text-gray-500',
                  'w-full cursor-pointer rounded-inherit px-2 py-0.5 text-center text-xs',
                ]"
              >
                {{ `${length} words` }}
              </div>
            </RadioGroupOption>
          </div>
        </RadioGroup>
      </h3>

      <div class="grid grid-cols-3 gap-2">
        <input
          type="text"
          :key="index"
          v-model="words[index]"
          @paste.prevent="onPasteWords"
          v-for="(word, index) in words"
          class="pit-input gradient-text"
          :placeholder="(index + 1).toString()"
        />
      </div>
    </div>

    <!-- 使用路径 -->
    <div class="mt-6">
      <Disclosure v-slot="{ open }">
        <DisclosureButton class="flex items-center gap-1">
          <span class="text-xs text-gray-500">MVC(Bitcoin sidechain) Path</span>
          <ChevronRightIcon :class="['h-4 w-4 text-gray-400 transition duration-200', open && 'rotate-90 transform']" />
        </DisclosureButton>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-out"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <DisclosurePanel class="mt-1 space-y-2 rounded-lg bg-gray-100 p-4 text-sm text-gray-500 shadow-inner">
            <h3 class="text-sm text-gray-900">What is a derivation path?</h3>
            <p>
              A derivation path is used to generate your wallet address. You can use the default path or customize it.
            </p>
            <p>
              The default path used by Metalet is
              <span>m/44'/10001'/0'</span>
            </p>
          </DisclosurePanel>
        </transition>
      </Disclosure>

      <div class="mt-2 text-sm tracking-wide text-black">
        <span>m/44'/</span>
        <input type="text" placeholder="10001" class="pit-input mx-2 w-16" v-model="pathDepth" />
        <span>'/0'</span>
      </div>
    </div>

    <div class="mt-8">
      <span class="text-xs text-gray-500">BTC Path</span>

      <SwitchGroup as="div" class="flex items-center mt-2">
        <Switch
          v-model="useSamePath"
          class="group relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <span class="sr-only">Use same path as MVC(Bitcoin sidechain)</span>
          <span aria-hidden="true" class="pointer-events-none absolute h-full w-full rounded-md bg-white"></span>
          <span
            aria-hidden="true"
            :class="[
              useSamePath ? 'bg-btn-blue' : 'bg-gray-200',
              'pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out',
            ]"
          ></span>
          <span
            aria-hidden="true"
            :class="[
              useSamePath ? 'translate-x-5' : 'translate-x-0',
              'pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
            ]"
          ></span>
        </Switch>

        <SwitchLabel as="span" class="ml-3 text-sm text-gray-500">
          Use the same path as MVC(Bitcoin sidechain)
        </SwitchLabel>
      </SwitchGroup>

      <Listbox v-model="selectedScript" v-if="!useSamePath">
        <div class="relative mt-4">
          <ListboxButton
            class="relative w-full cursor-default rounded-lg bg-[#f5f5f5] py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
          >
            <span class="block truncate">{{ selectedScript.path }}</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#f5f5f5] py-2 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            >
              <ListboxOption
                v-slot="{ selected }"
                v-for="script in selectableScripts"
                :key="script.name"
                :value="script"
                as="template"
              >
                <li :class="['text-gray-900', 'relative cursor-pointer select-none py-1 pl-3 pr-4']">
                  <span class="block truncate">{{ script.path }}</span>
                  <span
                    v-if="selected"
                    class="absolute inset-y-2 right-2 flex h-5 w-5 items-center justify-center rounded-md bg-[#1E2BFF] text-white"
                  >
                    <CheckIcon class="h-4 w-4" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>
    </div>

    <!-- ok -->
    <div class="mt-32 flex items-center justify-center">
      <button
        class="main-btn-bg mt-8 grow rounded-md py-3 text-sm text-sky-50"
        :class="[!finished && 'muted']"
        :disabled="!finished"
        @click="onSubmit"
      >
        OK
      </button>
    </div>

    <!-- error -->
    <div class="mt-4 text-center text-sm text-red-500" v-if="error">{{ error }}</div>
  </div>
</template>
